const fse = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const colors = require("colors");
const { performance } = require("perf_hooks");
const { log } = require("console");

const MAX_LOG_FILE_SIZE = 50000; //............... 50 KB // 1_000_000; // 1 MB // max size of log file

/* paths & files */
const backupDir = "./tempBackup"; //.............. temporary backup directory
const mutantsDir = "./gambit_out/mutants"; //..... gambit directory containing mutants
const testLogDir = "./testLogs"; //............... directory for test logs
let logDir = ""; //............................... test log directory
let currentLogFile = ""; //....................... test log file

/* initialization : yargs options & timer */
const start = performance.now();
const argv = yargs(hideBin(process.argv))
  .option("matchContract", {
    alias: "mc",
    type: "string",
    description: `Filters test contracts by name using a regex pattern. 
      This pattern is used with the \`--match-contract\` flag in Foundry's test command.
       Only contracts matching the pattern will be tested.`,
    default: "",
  })
  .option("noMatchContract", {
    alias: "nmc",
    type: "string",
    description: `Excludes test contracts by name using a regex pattern.
       This pattern is used with the \`--no-match-contract\` flag in Foundry's test command.
       Only contracts not matching the pattern will be tested.`,
    default: "",
  })
  .option("matchTest", {
    alias: "mt",
    type: "string",
    description: `Filters test functions by name using a regex pattern.
       This pattern is used with the \`--match-test\` flag in Foundry's test command.
        Only tests matching the pattern will be executed.`,
    default: "",
  })
  .option("noMatchTest", {
    alias: "nmt",
    type: "string",
    description: `Excludes test functions by name using a regex pattern.
       This pattern is used with the \`--no-match-test\` flag in Foundry's test command.
       Only tests not matching the pattern will be executed.`,
    default: "",
  })
  .option("matchMutant", {
    alias: "mm",
    type: "string",
    description: `Filters mutation files by name using a regex pattern.
       Only mutants matching this pattern will be tested.`,
    default: "",
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: `Enables verbose mode, printing more information about the test execution process.`,
    default: false,
  })
  .option("debug", {
    alias: "d",
    type: "boolean",
    description: `Activates debug mode, saving detailed operation logs and foundry output to a log file.`,
    default: false,
  })
  .fail((msg, err, yargs) => {
    if (err) {
      console.error(colors.red(`Error: ${err.message}`));
    } else {
      console.error(colors.red(`Error: ${msg}`));
    }
    yargs.showHelp();
    process.exit(1);
  })
  .strict().argv;

/* counters */
const mutantsUndetected = [];
let mutantsToSkipFromLog = [];
let mutantsNotMatchingPattern = [];
let mutantsSkippedDueToForgePattern = [];
let totalMutantsCount = 0;
let testedMutantsCount = 0;
let killedMutantsCount = 0;
let survivedMutantsCount = 0;
let skippedMutantsCount = 0;
let logFilesCounter = 1;

/***********************************************************************
                    Simple UI
***********************************************************************/
/**
 * @description: display progress bar & processing mutant message
 * @description: called in main loop, never < 1
 * @param {number} total
 * @param {number} current
 * @param {number} mutantNumber
 * @returns: void
 */
function updateProgressBar(total, current) {
  const length = 50;

  const progress = Math.round((current / total) * length);
  const percent = Math.round((current / total) * 100);
  const formattedPercent = percent.toString().padStart(3, " ");

  const bar =
    "[" +
    colors.cyan("*".repeat(progress)) +
    "-".repeat(length - progress) +
    `] ${formattedPercent}% `;
  const processingMessage = current
    ? colors.bold(`Processing mutant: ${colors.cyan(current)}`)
    : "";
  process.stdout.write(`\r${bar}${processingMessage}`);
}

/**********************************************************************
                    Format & Log helpers
**********************************************************************/
/**
 * @description: filter ANSI escape codes from text
 * @param {string} text
 * @returns {string} text without ANSI escape codes
 */
function filterAnsiEscapeCodes(text) {
  const ansiEscapeCodesRegex = /\x1B(?:[ * @-Z\\-_]|\[[0-?]*[ -/]*[ * @-~])/g;
  return text.replace(ansiEscapeCodesRegex, "");
}

/**
 * @description: log message to console and log file
 * @param {string} message
 * @param {boolean} toConsole, optional - default false
 * @param {boolean} toLog, optional - default false
 * @param {string} specialLogFile, optional - default null
 * @returns {Promise<void>}
 */
async function logMessage(
  message,
  toConsole = false,
  toLog = false,
  specialLogFile = null
) {
  const timestamp = new Date().toISOString();
  const finalMessage = `[${timestamp}] ${message}\n`;
  const logMsg = filterAnsiEscapeCodes(finalMessage);

  if (argv.verbose || toConsole) {
    console.log(message);
  }

  // if specialLogFile is defined, write to it (case of final summary)
  // we assume that this is the last log message to write (we don't use currentLogFile anymore)
  if (specialLogFile !== null) {
    currentLogFile = specialLogFile;
  }

  if (argv.debug || toLog) {
    try {
      await fse.appendFile(currentLogFile, logMsg);
    } catch (error) {
      const header = colors.red.bgYellow.bold("Error writing to log file:");
      const details = colors.bold("While writing :") + logMsg;
      console.error(`${header}\n${details}\n${error}`);
    }
  }
}

/***
 * @description: convert performance.now() output to human-readable duration format
 * @param {number} start
 * @param {number} end
 * @returns {string} durationFormat as 'hours h minutes m seconds s milliseconds ms microseconds µs'
 */
function convertPerformanceToDuration(start, end) {
  const timeTaken = end - start;
  const hours = Math.floor(timeTaken / 3600000);
  const minutes = Math.floor((timeTaken % 3600000) / 60000);
  const seconds = Math.floor((timeTaken % 60000) / 1000);
  const milliseconds = Math.floor(timeTaken % 1000);
  const durationFormat = `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
  return durationFormat;
}

/**
 * @description: format mutants list to shorter format (1, 2, 3-5, 6) / 'none' if empty
 * @param {number[]} mutantsList
 * @returns {string} formattedList
 */
function formatMutantsList(mutantsList) {
  if (mutantsList.length === 0) {
    return "none";
  }

  mutantsList.sort((a, b) => a - b);

  let formattedList = "";
  let startRange = mutantsList[0];
  let endRange = mutantsList[0];

  for (let i = 1; i < mutantsList.length; i++) {
    if (mutantsList[i] === endRange + 1) {
      endRange = mutantsList[i];
    } else {
      formattedList +=
        startRange === endRange
          ? `${startRange}, `
          : `${startRange}-${endRange}, `;
      startRange = mutantsList[i];
      endRange = mutantsList[i];
    }
  }

  formattedList +=
    startRange === endRange ? startRange : `${startRange}-${endRange}`;
  return formattedList;
}

/**
 * @description: get command options from argv and format them in string
 * @param {object} argv
 * @returns {object} {contractOption, noContractOption, testOption, noTestOption}
 */
function getCommandOptions(argv) {
  const contractOption = argv.matchContract
    ? `--match-contract "${argv.matchContract}" `
    : "";
  const noContractOption = argv.noMatchContract
    ? `--no-match-contract "${argv.noMatchContract}" `
    : "";
  const testOption = argv.matchTest ? `--match-test "${argv.matchTest}" ` : "";
  const noTestOption = argv.noMatchTest
    ? `--no-match-test "${argv.noMatchTest}" `
    : "";
  return { contractOption, noContractOption, testOption, noTestOption };
}

/**
 * @description: calculate mutation score
 * @returns {string} mutationScore
 */
function calculateMutationScore() {
  return testedMutantsCount > 0
    ? ((killedMutantsCount / testedMutantsCount) * 100).toFixed(2) + "%"
    : "N/A.";
}

/**
 * @description: build summary header
 * @param {string} duration
 * @param {object} options
 * @returns {string} summaryHeader
 */
function buildSummaryHeader(duration, options) {
  return (
    colors.bold(`\nTests over mutants run in : ${duration}\n\n`) +
    colors.blue(
      `with command : forge test ${options.contractOption}${options.noContractOption}${options.testOption}${options.noTestOption}\n\n`
    )
  );
}

/**
 * @description: build summary comments (mutants skipped in log, not matching pattern, skipped due to forge pattern)
 * @param {string} skippedMutantsText
 * @param {string} notMatchingPatternText
 * @param {string} skippedDueToForgePattern
 * @returns {string} summaryComments
 */
function buildSummaryComments(
  skippedMutantsText,
  notMatchingPatternText,
  skippedDueToForgePattern
) {
  return (
    colors.blue(`Mutants skipped in 'mutants.log': ${skippedMutantsText}\n`) +
    colors.blue(
      `Mutants skipped not matching mutant pattern: ${notMatchingPatternText}\n`
    ) +
    colors.blue(
      `Mutants skipped due to no matching test pattern: ${skippedDueToForgePattern}\n\n`
    )
  );
}

/**
 * @description: build summary result (total mutants, skipped, tested, killed, survived, mutation score, undetected mutants)
 * @param {string} mutationScore
 * @returns {string} summaryResult
 */
function buildSummaryResult(mutationScore) {
  return (
    colors.bold(
      `Total of mutants : ${colors.blue(
        totalMutantsCount
      )}, skipped : ${colors.yellow(
        skippedMutantsCount
      )}, tested : ${colors.cyan(
        testedMutantsCount
      )} of which killed : ${colors.green(
        killedMutantsCount
      )}, survived : ${colors.red(survivedMutantsCount)}\n`
    ) +
    `Mutation score: ${mutationScore}\n` +
    (testedMutantsCount > 0
      ? mutantsUndetected.length === 0
        ? colors.green(`Congratulations! All mutants were detected.\n\n`)
        : colors.red(`Undetected mutants: ${mutantsUndetected}\n\n`)
      : colors.yellow(`No mutant tested!\n\n`))
  );
}

/**
 * @description: end timer, log summary and display it
 * @returns {Promise<void>}
 */
async function endTimerAndLogSummary() {
  const end = performance.now();
  const duration = convertPerformanceToDuration(start, end);
  const options = getCommandOptions(argv);
  const skippedMutantsText = formatMutantsList(mutantsToSkipFromLog);
  const notMatchingPatternText = formatMutantsList(mutantsNotMatchingPattern);
  const skippedDueToForgePattern = formatMutantsList(
    mutantsSkippedDueToForgePattern
  );
  const mutationScore = calculateMutationScore();

  const header = buildSummaryHeader(duration, options);
  const comments = buildSummaryComments(
    skippedMutantsText,
    notMatchingPatternText,
    skippedDueToForgePattern
  );
  const result = buildSummaryResult(mutationScore);

  await logMessage(
    header + comments + result,
    true,
    true,
    replaceLogNameWithResult(currentLogFile)
  );
}

/*********************************************************************** 
                        files helpers
***********************************************************************/
/**
 * @description: recursive search for file in folder
 * @description: used to find the mutant file in the mutant folder
 * @description: should be only one file in each mutant folder
 * @param {string} dir
 * @param {string} relativePathBase
 * @returns {Promise<[string, string]>} [finalFilePath, relativePath]
 */
async function searchFileInDir(dir, relativePathBase) {
  const files = await fse.readdir(dir);
  if (files.length != 1) {
    throw new Error(
      `There should be only one file or folder in mutant folder: ${dir}`
    );
  }

  let relativePath = path.join(relativePathBase, files[0]);
  let finalFilePath;
  const filePath = path.join(dir, files[0]);
  const stat = await fse.stat(filePath);

  if (stat.isDirectory()) {
    [finalFilePath, relativePath] = await searchFileInDir(
      filePath,
      relativePath
    );
  } else {
    finalFilePath = filePath;
  }
  return [finalFilePath, relativePath];
}

/**
 * @description: find single mutant file details
 * @param {string} basePath
 * @param {number} mutantId
 * @returns {Promise<[string, string, string, string]>} [id, fileName, finalFilePath, relativePath]
 */
async function getMutantFileDetails(basePath, mutantId) {
  const id = mutantId.toString();
  const searchPath = path.join(basePath, id);
  let finalFilePath = ""; //.............. complete path of mutant file
  let relativePath = "./"; //............. mirror original file path

  try {
    [finalFilePath, relativePath] = await searchFileInDir(
      searchPath,
      relativePath
    );
  } catch (error) {
    // searchFileDir already called at initialization,
    // potential error should be due to memory or file system issue or user manipulation
    console.error(
      `${colors.red.bgYellow.bold("Error searching mutant file:")} ${error}`
    );
    return [id, null, null, null];
  }
  const fileName = path.basename(finalFilePath).split(".")[0];
  return [id, fileName, finalFilePath, relativePath];
}

/**
 * @description: replace mutant with backup
 * @param {string} originalFilePath
 * @param {string} backupFilePath
 * @returns {Promise<void>}
 */
async function restoreOriginalFile(backupFilePath, originalFilePath) {
  try {
    if (await fse.pathExists(backupFilePath)) {
      await fse.copy(backupFilePath, originalFilePath, { overwrite: true });
      await logMessage(
        `Restored original file ${originalFilePath} from backup`
      );
    } else {
      throw new Error(
        `Backup file ${backupFilePath} does not exist. Cannot restore original file.`
      );
    }
  } catch (error) {
    // Specify error to alert potential issue with original file not being restored
    throw new Error(
      `Error when restoring original file ${originalFilePath} from backup: `,
      error
    );
  }
}

/**
 * @description: backup original file
 * @param {string} originalFilePath
 * @param {string} backupFilePath
 * @returns {Promise<void>}
 */
async function backupOriginalFile(originalFilePath, backupFilePath) {
  try {
    await fse.ensureDir(path.dirname(backupFilePath));
    await fse.copy(originalFilePath, backupFilePath);
    await logMessage(
      `Backed up original file ${originalFilePath} to ${backupFilePath}`
    );
  } catch (error) {
    // Specify error to alert potential issue with original file
    throw new Error(
      `Error when creating backup of original file: ${error}`,
      error
    );
  }
}

/**
 * @description: find unique log folder
 * @description: iterate folder number to get the next unique folder name
 * @returns {Promise<string>} uniqueDirectoryName
 */
async function findUniqueLogFolder() {
  const baseDirectoryName = "mutationsTestLog";
  let folderNumber = 0;
  const directoryPath = path.join(__dirname, testLogDir);
  let uniqueDirectoryName = path.join(directoryPath, `${baseDirectoryName}`);

  await fse.ensureDir(directoryPath);
  while (await fse.pathExists(uniqueDirectoryName)) {
    folderNumber++;
    uniqueDirectoryName = path.join(
      directoryPath,
      `${baseDirectoryName}-${folderNumber}`
    );
  }
  // Ensure that the directory is created
  await fse.ensureDir(uniqueDirectoryName);

  return uniqueDirectoryName;
}

/**
 * @description: generate log file path
 * @param {string} logDir
 * @returns void
 */
function generateLogFilePath(logDir) {
  const baseFileName = path.basename(logDir);
  const fileExtension = ".txt";
  return path.join(
    logDir,
    `${baseFileName}_${logFilesCounter}${fileExtension}`
  );
}

/**
 * @description: create log file
 * @param {string} logDir
 * @returns void
 */
async function createLogFile(logDir) {
  const filePath = generateLogFilePath(logDir);

  await fse.writeFile(filePath, "");
  currentLogFile = filePath;
  await logMessage(`Creating new log file: ${filePath}`);

  return filePath;
}

/**
 * @description: update log file (check size and create new if necessary)
 * @param {string} logDir
 * @returns void
 */
async function updateLogFile(logDir) {
  const filePath = generateLogFilePath(logDir);

  const stats = await fse.stat(filePath);
  const fileSizeInBytes = stats.size;
  if (fileSizeInBytes > MAX_LOG_FILE_SIZE) {
    await logMessage(
      `Log file ${filePath} exceeds ${MAX_LOG_FILE_SIZE / 1000} KB`
    );
    logFilesCounter++;
    return createLogFile(logDir);
  }

  return filePath;
}

/**
 * @description: checks whether the file on which the mutation is made exists in the source
 * @param {string} mutantsDir
 * @param {string} sourceDir
 * @throws {Error} if mutant file does not refer to an existing file in the source (source deleted ...)
 * @returns: void
 */
async function checkMutantsAgainstSource(mutantsDir, sourceDir) {
  await logMessage("Checking mutants against source...");
  try {
    const mutants = await fse.readdir(mutantsDir);

    for (const mutant of mutants) {
      const mutantPath = path.join(mutantsDir, mutant);

      if ((await fse.stat(mutantPath)).isDirectory()) {
        const [mutantFiles] = await searchFileInDir(mutantPath, "./");
        const relativeMutatedFilePath = path.relative(mutantPath, mutantFiles);

        try {
          await fse.stat(relativeMutatedFilePath);
        } catch (error) {
          throw new Error(
            `Mutant file '${mutantFiles}' refers to '${relativeMutatedFilePath}', which does not exist in the source.`
          );
        }
      }
    }
    await logMessage("All mutants have been successfully verified.\n");
  } catch (error) {
    throw Error(
      `Error checking mutant file against existing file:\n${error.message}`
    );
  }
}

/**
 * @description: format current log file name to result file name
 * @description: 'mutationsTestLog-1_1.txt' => 'mutationsTestLog-1-result.txt'
 * @description: -X is optional, _Y and .txt are removed if it exists, -result.txt is added
 * @param {string} logFileName
 * @returns {string} resultFileName
 */
function replaceLogNameWithResult(logFileName) {
  if (!logFileName.endsWith(".txt")) {
    logMessage(colors.red.bgYellow.bold("Invalid log file name format."), true);
  }
  let resultFileName = logFileName.slice(0, -4);
  resultFileName = resultFileName.replace(/_\d+$/, "");

  resultFileName += "-result.txt";
  return resultFileName;
}

/************************************************************************
                        Main logic
***********************************************************************/
/**
 * @description: parse mutants.log file and return mutants to skip
 * @description: mutants.log file is generated by gambit
 * @description: lines of mutants identified as equivalent or that dev want to skip should be prefixed with '-'
 * @returns {Promise<number[]>} mutantsToSkip
 */
async function getMutantsFlaggedAsSkippedInLog() {
  const filePath = path.join("gambit_out", "mutants.log");
  const mutantToSkip = [];

  try {
    const fileContent = await fse.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");

    for (let line of lines) {
      if (line.startsWith("-")) {
        const mutantNumberStr = line.substring(1, line.indexOf(","));
        const mutantNumber = parseInt(mutantNumberStr, 10);
        if (isNaN(mutantNumber)) {
          await logMessage(
            colors.red(
              `Invalid mutant number format: ${error.message}\n Invalid mutation line ${line} will be skipped.`
            )
          );
          continue;
        }

        mutantToSkip.push(mutantNumber);
      }
    }
  } catch (error) {
    throw new Error(
      `An error occurred when filtering mutants from log: `,
      error
    );
  }

  return mutantToSkip;
}

/**
 * @description get mutants not matching the pattern to skip them
 * @param {number} totalOfMutants
 * @param {number} mutantPattern
 * @returns
 */
async function getMutantsNotMatchingPattern(totalOfMutants, mutantPattern) {
  let mutantToSkip = [];

  if (mutantPattern === "") {
    return mutantToSkip;
  }

  const mutantRegex = new RegExp(mutantPattern);

  for (let i = 1; i <= totalOfMutants; i++) {
    const [, mutantFileName] = await getMutantFileDetails(mutantsDir, i);
    if (mutantFileName === null) {
      await logMessage(
        `Invalid infos for mutant ${i}, matchMutant not test.\n`
      );
      continue;
    }
    if (!mutantRegex.test(mutantFileName)) {
      mutantToSkip.push(i);
    }
  }

  return mutantToSkip;
}

/**
 * @description: check if mutant should be skipped
 * @param {number} mutantId
 * @param {number[]} mutantsToSkipFromLog
 * @param {number[]} mutantsNotMatchingPattern
 * @returns {Promise<boolean>} isSkippedMutant
 */
async function isMutantToSkip(
  mutantId,
  mutantsToSkipFromLog,
  mutantsNotMatchingPattern
) {
  // mutants flagged in the mutants.log file should be skipped
  if (mutantsToSkipFromLog.includes(mutantId)) {
    await logMessage(
      `Mutant ${mutantId} is flagged in the mutants.log file. Skipping...\n`
    );
    return true;
  }
  // mutants that do not match the --match-mutant regex should be skipped
  if (mutantsNotMatchingPattern.includes(mutantId)) {
    await logMessage(
      `Mutant ${mutantId} does not match the --match-mutant regex. Skipping...\n`
    );
    return true;
  }
  return false;
}

/**
 * @description: run forge test
 * @description: options given by the user are passed to the forge test command
 * @param {number} mutant
 * @param {string} contract
 * @param {string} test
 * @returns: void
 */
async function runForgeTest(mutant, contract, noContract, test, noTest) {
  const matchContract = contract ? `--match-contract ${contract} ` : "";
  const matchTest = test ? `--match-test ${test} ` : "";
  const noMatchContract = noContract
    ? `--no-match-contract ${noContract} `
    : "";
  const noMatchTest = noTest ? `--no-match-test ${noTest} ` : "";
  const command = `forge test ${matchContract}${matchTest}${noMatchContract}${noMatchTest}--fail-fast`;

  logMessage(`Running forge test for mutant ${mutant}...`);
  try {
    const output = execSync(command, { stdio: "pipe" }).toString();

    //check if output contains "No tests match the provided pattern"
    if (output.includes("No tests match the provided pattern")) {
      skippedMutantsCount++;
      await logMessage(`Skipped ! Forge test output:\n${output}`);
      mutantsSkippedDueToForgePattern.push(parseInt(mutant, 10));
    } else {
      testedMutantsCount++;
      survivedMutantsCount++;
      await logMessage(`PASSED ! Forge test output:\n${output}`);
      mutantsUndetected.push(mutant);
    }
  } catch (error) {
    testedMutantsCount++;
    killedMutantsCount++;
    await logMessage(`FAILED ! Forge test output:\n${error.stdout}`);
  }
  await logMessage(`Finished testing mutant ${mutant}\n`);
}

/**
 * @description: main function
 * @returns: void
 */
async function main() {
  let lastMutantFile = "";
  let lastMutantFilePath = "";

  // get new log folder and set current log file
  logDir = await findUniqueLogFolder();
  await createLogFile(logDir);
  // check if mutants files match source files
  await checkMutantsAgainstSource("gambit_out/mutants", "src");

  const mutants = await fse.readdir(mutantsDir);
  totalMutantsCount = mutants.length;
  mutantsToSkipFromLog = await getMutantsFlaggedAsSkippedInLog();
  mutantsNotMatchingPattern = await getMutantsNotMatchingPattern(
    totalMutantsCount,
    argv.matchMutant
  );

  // iterate over mutants
  for (let i = 1; i <= totalMutantsCount; i++) {
    await logMessage(`Processing mutant ${i}...`);

    // update the current log file if necessary
    await updateLogFile(logDir);
    // ui animation
    updateProgressBar(totalMutantsCount, i, i);

    const isSkippedMutant = await isMutantToSkip(
      i,
      mutantsToSkipFromLog,
      mutantsNotMatchingPattern
    );
    // Skip mutant if it does not match the --match-mutant regex or if it is flagged in the mutants.log file
    if (isSkippedMutant) {
      skippedMutantsCount++;
      continue;
    }

    // get mutant file details
    const [mutant, mutantFileName, mutantFilePath, mutantFileRelativePath] =
      await getMutantFileDetails(mutantsDir, i);
    if (mutantFileName === null) {
      skippedMutantsCount++;
      await logMessage(
        `Skipped mutant ${i} due to error in mutant file details.\n`
      );
      continue;
    }
    // restore original file if it's a new mutant file and backup the new file being mutated
    if (lastMutantFilePath !== mutantFileRelativePath) {
      if (lastMutantFilePath !== "") {
        await restoreOriginalFile(
          path.join(backupDir, lastMutantFilePath),
          lastMutantFilePath
        );
      }
      await backupOriginalFile(
        mutantFileRelativePath,
        path.join(backupDir, mutantFileRelativePath)
      );
      lastMutantFilePath = mutantFileRelativePath;
      lastMutantFile = mutantFileName;
    }
    // copy mutant file to contract file
    await fse.copy(mutantFilePath, mutantFileRelativePath);
    await logMessage(
      `Copied mutant ${mutant} from ${mutantFilePath} to ${mutantFileRelativePath}`
    );

    await runForgeTest(
      mutant,
      argv.matchContract,
      argv.noMatchContract,
      argv.matchTest,
      argv.noMatchTest
    );
  }

  if (lastMutantFile !== "") {
    await restoreOriginalFile(
      path.join(backupDir, lastMutantFilePath),
      lastMutantFilePath
    );
  }

  await fse.remove(backupDir);
  await logMessage(`Removed backup directory ${backupDir}\n`);

  await endTimerAndLogSummary();
}

main().catch((err) => console.error(err));
