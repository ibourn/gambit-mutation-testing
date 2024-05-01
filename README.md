# Beyond Coverage: Defeating Hidden Mutants in Your Code

## Table of Contents

- [Introduction](#introduction)
- [Blockchain Context](#blockchain-context)
- [The Importance of Testing in Smart Contract Development](#the-importance-of-testing-in-smart-contract-development)
  - [Exploring Different Types of Tests](#exploring-different-types-of-tests)
  - [Different Testing Environments](#different-testing-environments)
  - [Testing Metrics in Development](#testing-metrics-in-development)
- [Mutation Testing](#mutation-testing)
- [Origin and Principle](#origin-and-principle)
- [How Mutation Testing Works](#how-mutation-testing-works)
- [Why is Mutation Testing Important?](#why-is-mutation-testing-important)
- [Test Your Tests with Gambit!](#test-your-tests-with-gambit)
  - [Installation Prerequisites](#installation-prerequisites)
  - [Installing and Configuring Gambit](#installing-and-configuring-gambit)
  - [Creating Mutants](#creating-mutants)
  - [Outputs Produced by Gambit](#outputs-produced-by-gambit)
  - [Limitations of Mutation Testing](#limitations-of-mutation-testing)
- [Putting it into Practice with an Example](#putting-it-into-practice-with-an-example)
- [Automating Mutation Testing with Foundry](#automating-mutation-testing-with-foundry)
  - [Example of Automation Script](#example-of-automation-script)
- [Future Perspectives](#future-perspectives)
- [Conclusion](#conclusion)

## TL;DR

- Testing is essential for ensuring the security of smart contracts.
- High test coverage does not guarantee the absence of flaws.
- Mutation testing evaluates the robustness of our tests by introducing targeted changes into the code to see if they are detected.
- Gambit stands out as a valuable tool for conducting mutation testing, facilitating the creation of mutants.
- Whether you are a beginner or an expert, adopting mutation testing can greatly enhance the security and reliability of your contracts.

## Introduction

Have you achieved 100% test coverage? Congratulations! But have you really eliminated all the mutants? Far from being a mere chore, testing plays a crucial role in the development of applications, including smart contracts. Various metrics are used to assess the quality of our tests, often seeking to achieve total code coverage. But is that enough to guarantee their relevance and effectiveness? There is a solution: testing our tests to get a true measure of the quality of our test arsenal.

Recently, thanks to a [video](https://www.youtube.com/watch?v=HIN8lmj597M) by Owen Thurm, I discovered the [Gambit tool by Certora](https://github.com/Certora/gambit), which automates the generation of mutations for contracts written in Solidity. Mutation testing remains largely under-documented, especially in the blockchain field, making it a topic worthy of further exploration and exposure.

In the remainder of this article, we will explore their concept and usefulness in a traditional test suite, before presenting a practical guide to installing and using Gambit. Then, a script to automate mutation testing will be provided, along with a repository replicating the example from the video. This will give readers the opportunity to follow the example, in the hope that these practical resources will facilitate their discovery of the tool.

## Blockchain Context

Before delving into the details, it is essential to recall the unique context in which blockchain operates. Its main characteristic, immutability, means that once a contract is deployed, it cannot be changed. This permanence makes the security of deployed contracts crucial, as any undetected flaw or bug could be exploited, particularly in sectors such as DeFi, where financial motivations are high.

According to a [recent report](https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2024/), in 2023, funds stolen from hacks decreased by about 54.3%, reaching $1.7 billion. However, the number of individual hacking incidents actually increased, from 219 in 2022 to 231 in 2023. This increase in incidents, despite a decrease in the total amount stolen, underscores the importance of strengthening security measures. If we aspire to widespread adoption of blockchain, special attention must be paid to security from the beginning of the development process.

To address these challenges, the community relies on code audits, bug bounty programs, and other rigorous practices from the design of contracts. However, these measures, although essential, are not always sufficient to guarantee foolproof security. It is therefore crucial to adopt a proactive approach and integrate advanced security techniques from the early stages of smart contract development.

## The Importance of Testing in Smart Contract Development

### Exploring Different Types of Tests

To ensure the security and reliability of smart contracts, various types of tests and practices are employed. It is important to note that while we focus on blockchain development in this article, the testing concepts and methods mentioned here have been established and applied in the field of software development in general for a long time. These practices are fundamental to ensuring quality and security in all types of software development. The list below is not exhaustive, but it highlights some of the most commonly used testing practices in blockchain development:

- **Test Driven Development (TDD):** This method encourages writing tests before the actual development of the functionality. It aims to clarify the code's objectives from the start. By adopting this strategy, the developer commits to shaping the code to immediately meet the established requirements.

- **Unit Tests:** They allow for the correct execution of the smallest units of a smart contract, such as functions or methods, to be verified in isolation.

- **Integration Tests:** These tests aim to evaluate the operation of the smart contract in interaction with other contracts or system components. They ensure that all parts work correctly together, simulating complex interactions to detect potential errors in interfaces or integration logic.

- **Fuzzing:** This technique involves subjecting the contract to a multitude of random inputs, with the goal of discovering unexpected behaviors or vulnerabilities. It allows for exploring a wide range of scenarios and ensuring the contract's robustness against unforeseen inputs.

- **Invariant Tests:** These tests, a category of a broader approach known as contract programming, verify that certain properties or rules of the contract remain constant before and after transaction execution, such as the total amount of tokens (total supply) remaining unchanged, for example. To ensure the robustness of these invariants under various conditions, state fuzzing can be used. This approach generates sequences of function calls with random inputs while preserving intermediate states, simulating a dynamic and unpredictable testing environment. This allows for exhaustive testing of the contract by covering complex interactions and execution paths that might remain unexplored with more traditional testing methods, as if subjecting the system to a series of intensive tests to assess its resilience.

- **Static Analysis:** This method examines the contract's source code without executing it, scrutinizing each line of code to identify programming errors, security flaws, or potential vulnerabilities. It can reveal issues such as infinite loops, dangerous function calls, or execution paths that could lead to unexpected behavior.

- **Formal Verification:** It is based on creating a mathematical model to represent the code and verify certain properties or invariants (always true conditions) to mathematically prove that the behavior of the code matches our expectations in all possible cases. One of the techniques used for this verification is called symbolic execution, which is the most widespread in blockchain development. It involves traversing all possible paths in a program, converting these paths into mathematical expressions. Then, an equation solver examines these expressions to see if our properties hold or not. Formal verification seeks mathematical proofs that our properties are either always true or potentially false.

### Different Testing Environments

The tests mentioned above are executed in different environments to simulate various usage conditions:

- **Local:** Tests are first performed locally, on the developer's machine. This allows for testing the code in isolation, in a controlled environment.

- **Forked Environment:** After local tests, an environment that replicates an existing blockchain is often used. This allows for testing the interactions of the contract with other contracts in a context that simulates reality but without the risks associated with the main blockchain.

- **Testnet:** Contracts are then deployed on a testnet, which is a test blockchain designed to simulate conditions closer to production, including interactions with simulated external entities (mocked).

- **Staging Environment (or "Pre-production"):** Finally, depending on the conditions, a staging environment allows for deploying and testing contracts in conditions almost identical to those of production, including execution times and transaction fees.

These different stages ensure that the contract is robust and ready for production deployment, thus minimizing the risks of errors or vulnerabilities.

### Testing Metrics in Development

#### What is Code Coverage?

In the world of blockchain development, where security and reliability are paramount, unit tests and fuzzing represent the bare minimum to verify the integrity of smart contracts. However, beyond the application of these tests, how can we assess the quality of our tests? This is where testing metrics, and particularly the measure of code coverage, come into play.

Code coverage, often referred to as "coverage" in English, is the primary metric used to evaluate the quality of automated tests. It measures the percentage of your code that is executed during the running of your tests. More specifically, it can be broken down into several types:

- Line coverage: This type measures whether each line of code in your smart contract was executed at least once during the tests.
- Branch coverage: It checks whether every condition in your code (for example, if and switch statements) has been tested in all its possible outcomes (true/false).
- Function coverage: It ensures that every function or method in your code was called during the tests.

The goal is to achieve 100% coverage, which would theoretically mean that every part of the code has been tested. But this raises an important question: does this coverage guarantee the quality of our tests?

#### Does Complete Coverage Mean Quality Tests?

Achieving 100% coverage is a commendable goal, but it does not necessarily guarantee that the code is well-tested. Why? Because code coverage measures the quantity of code that is tested, not the quality of the tests themselves. A line of code can be "covered" if it is executed during a test, but that does not mean that the test properly checks the behavior or outcome of that line. In other words, a test can pass over a line of code without detecting incorrect behavior or a security flaw. This is why it is crucial not to rely solely on code coverage as an indicator of test quality. It is also necessary to ensure that the tests are well-designed, that they test the right scenarios, and that they verify the expected behaviors of the code. This is where mutation tests, discussed in the following section, come into play by helping us assess the actual effectiveness of our tests and identify potential blind spots with another metric: the mutation score.

## Mutation Testing

Mutation testing is an advanced method to assess the robustness of unit test suites. By slightly modifying the source code (mutations), this approach checks whether existing tests can detect these changes — essentially, if our tests are sensitive enough to identify potential errors.

### Origin and Principle

Invented in 1971 by Richard Lipton, the technique of mutation testing was designed to measure the effectiveness of tests without the need for additional code writing (or almost none). Over the years, it has established itself as a valuable tool for refining and validating the coverage of unit tests.

At the heart of mutation testing is the idea of "code sickness": deliberate modifications (mutations) are applied to the source code to create slightly altered versions ("mutants"). The ability of existing tests to detect and fail because of these mutations reveals the effectiveness and completeness of the test suite. In other words, if a mutant survives (i.e., if the tests continue to pass despite the mutation), it indicates a gap in test coverage.

### How Mutation Testing Works

The process involves creating "mutants" by making slight modifications to the original code. The mutations applied to the code can be of different forms, for example:

- Modifying the value of a constant: For instance, changing `const int MAX_VALUE = 10;` to `const int MAX_VALUE = 0;` to see if the tests detect the change.
- Replacing operators: For example, replacing an addition operator (+) with a subtraction operator (-) in a mathematical expression.
- Removing instructions: Such as removing a function call to test the impact of its absence on the program's behavior.
- Mutating conditions in control statements: This technique involves modifying conditions in control structures, like changing an `if (condition)` to `if (!condition)`, or adjusting a comparator from `<` to `==`, `>`, or `>=`. The goal is to explore and test the code's reaction to all possible forms a condition might take, ensuring that alternative cases are properly handled.
- Modifying function returns: Changing the return of a function to return a fixed or incorrect value, in order to test the reaction of components that depend on this function.
- Eliminating branches in conditional structures: Removing an else branch or a case in a switch.

Tests are then run on the code one mutation at a time.

If a test fails because of a mutation, it indicates that our tests have detected the mutation and thus provide good test coverage for that part of the code.
If the tests still pass despite the code mutations, then they are not sufficient to detect the regression brought about by the mutant. In this case, we talk about surviving mutations. Conversely, if at least one test fails when running the mutated code, then the mutation is said to be killed (implied by the test).

### Why is Mutation Testing Important?

Mutation testing is a powerful tool for assessing the quality of existing tests. By checking whether these tests can detect deliberately introduced errors, it helps identify potential blind spots in the tests or potential bugs in the code. This increases confidence in the tests' ability to effectively cover the code and detect potential errors.

**Pseudocode Example:**
Let's assume we have the following function for a very basic illustration:

```
function isEligibleForRegistration(age)
if age >= 18
return true
else
return false
```

And here is a basic test for this function:

```
test_isEligibleForRegistration()
assert(isEligibleForRegistration(20) == true) // Test for an eligible user
assert(isEligibleForRegistration(16) == false) // Test for an ineligible user
```

This test checks if the function correctly returns true for a 20-year-old user and false for a 16-year-old user.

Suppose we now introduce a very subtle mutation in the function:

```
function isEligibleForRegistration(age)
if age > 18 // Mutation: changing the operator from >= to >
return true
else
return false
```

With this mutation, the function would incorrectly return false for a user exactly aged 18, thus violating the initial eligibility rule. But the current test would not notice it; it would remain green. We would then have a surviving mutant.

To detect this mutation and ensure that the age condition is correctly tested, we need to add a specific test case for the age limit:

```
test_isEligibleForRegistration_ageLimit()
assert(isEligibleForRegistration(18) == true) // This test would fail with the mutated function
```

This additional test would help detect the introduced mutation and ensure that the edge case of an 18-year-old user is properly handled by the function.

## Test Your Tests with Gambit!

In the ever-evolving landscape of blockchain development, a variety of tools have been developed to optimize and secure the creation process. Among these, many tools are designed to facilitate testing, and within the realm of mutation testing, we can mention [**Vertigo-rs**](https://github.com/RareSkills/vertigo-rs) maintained by Jeffrey Scholz of [RareSkills](https://www.rareskills.io/). Simpler to use, it allows automatic test execution but seems to generate fewer mutations for now. That's why our focus is on **[Gambit](https://github.com/Certora/gambit)**, a tool developed by [Certora](https://www.certora.com/), a security company providing audit services and offering a solution for formal verifications in addition to Gambit.

In this section, we will summarize the use of the Gambit tool for quick hands-on experience. We will deliberately take the example from the video mentioned in the introduction so that those interested can follow along and have the code in front of them. Although there are many options available in the [Gambit documentation](https://github.com/Certora/gambit), we will focus on those that allow immediate and simple usage.

### Installation Prerequisites

Before you start using Gambit, you need to ensure that certain tools are installed on your system:

- **Rust**. As Gambit is written in Rust, you must have [rust](https://www.rust-lang.org/tools/install) installed.
  Ensure the installation was successful by opening a terminal and running `rustc --version`.

- **Solc**. The Solidity compiler, [solc](https://docs.soliditylang.org/en/latest/installing-solidity.html), is also necessary for generating mutants. You should have solc binaries compatible with your project, and to manage different versions, you may prefer using [solc-select](https://github.com/crytic/solc-select).
  Confirm the installation by running `solc --version` in a terminal.

### Installation and Configuration of Gambit

Once the prerequisites are installed, you can follow one of the various [installation methods](https://github.com/Certora/gambit?tab=readme-ov-file#installation). Here, we will choose to clone the repository.

- **Clone the Gambit repository:**

  ```bash
  git clone https://github.com/Certora/gambit.git

  ```

- **Then, install Gambit with Cargo:**
  Navigate to the cloned Gambit directory and run the following command:

  ```bash
  cargo install --path .
  ```

  This command installs Gambit on your system and adds it to your PATH, allowing you to invoke it from any directory.

### Creating Mutants

Gambit offers two main commands: `mutate` and `summary`. The former generates mutants, while the latter provides a summary of the mutations performed. This article will focus on using mutate. According to the [Gambit documentation](https://docs.certora.com/en/latest/docs/gambit/gambit.html#mutation-types), the tool offers a multitude of options to specify parameters necessary for solc, limit mutations, and filter files, contracts, and functions to mutate. By default, in the absence of specific options, Gambit will perform mutations on all functions of all contracts, applying all available types of mutations.

For more efficient and organized management, it is possible to use a configuration file. Here is an example:

```javascript
gambitconfig.json;
```

```json
[
  {
    "filename": "/src/Ticketer.sol",
    "contract": "Ticketer",
    "solc_optimize": true,
    "solc_remappings": [
      "openzeppelin/contracts=lib/openzeppelin-contracts/contracts/"
    ]
  },
  {
    "filename": "/src/Blip.sol",
    "contract": "D",
    "functions": ["bang"],
    "solc": "solc8.12",
    "mutations": ["binary-op-mutation", "swap-arguments-operator-mutation"]
  }
]
```

Each entry in this file corresponds to a specification for performing mutations on a given file. For a contract and its file path, you have the option to specify the functions to mutate, the type of mutations to apply, as well as specific solc information (such as the version to use and the remapping to locate dependencies). In the example, only the `Ticketer.sol` and `Blip.sol` files will be used to create mutants. For `Ticketer`, all functions will be visited and all possible types of mutations will be applied. For `D`, we specify that we only want to consider the `bang` function and the mutation types: `binary-op-mutation` and `swap-arguments-operator-mutation`.

To apply this configuration file, you must use the `--json` option with the following command:

`gambit mutate --json ./gambitconfig.json`

This approach allows for advanced customization of mutant generation, adapting to the complexity and specific needs of your projects.

### Outputs Produced by Gambit

When you use `Gambit` to generate mutants, the tool creates a `gambit_out` folder which serves as a central repository for all data generated during the mutation process. Here is an overview of the key elements you will find:

- **mutants/ folder:** It contains all the generated mutants, organized to reflect the structure of the original contract. Each mutant is placed in an individual directory, named after its mutant ID, for example, 1, 2, 3, etc. This structure facilitates the identification and examination of each specific mutation. In each file, Gambit adds a comment line specifying the mutation it performed at the location it was made.

- **mutants.log file:** It provides a log of each applied mutation. For each entry, you will find the mutant's number (corresponding to its directory in mutants/), the type of mutation performed, the original value, and the new value post-mutation.

- **gambit_results.json file:** A JSON file containing detailed results of the mutation operation. This is a more detailed version of the previous log.

- **input_json/ folder:** Contains intermediate files produced by solc that are used during the mutation process. These files serve as a basis for generating the mutants.

### Limitations of Mutation Testing

One of the first limitations to consider when using mutation testing, including with Gambit, is the generation of what are called "equivalent mutants." These mutants, although modified, do not lead to any change in the code's behavior. Consider the following example:

```
int index = 0;
while(...) {
...;
index++;
if (index == 10) break;
}
```

In this example, mutating the operator `==` to `>=` would not modify the code's behavior. These **equivalent mutants** can skew your mutation score, so it is wise to ignore them. For this, it might be useful to mark the mutation lines considered as unnecessary.

Moreover, it is important to note that, given the size and complexity of the code, running tests on a large number of mutants (say 1000) could take several hours. Therefore, it is essential to note that conducting mutation tests on the entire project is not an operation done every 5 minutes. This operation occurs at key moments in the testing phase, requiring careful planning. Designing a strategy for your mutation testing campaigns, by grouping or segmenting tests, can reduce the total duration of tests and simplify the correction of surviving mutants (managing hundreds of survivors at the same time can prove impractical).

Although mutation tests are generally designed for unit tests, it is possible to devise strategies to extend them to other types of tests. However, it is worth considering whether this is truly relevant and efficient for your project. And crucially, it is essential to consider the time it will require.

## Putting it into Practice with an Example

For those among you eager to quickly experiment on your own, I propose a simple and concrete approach. We will clone the [repository linked to this article](https://github.com/ibourn/gambit-mutation-testing) which reproduces the example from the video mentioned in the introduction. Thus, you can follow the reasoning of the article, experiment with real code, and have a detailed video support if needed.

This is a Foundry project with a basic ticket sales contract. The tests are intentionally succinct for demonstration purposes. In the project, you will also find a JavaScript script detailed later.

### Prerequisites and Installation:

1. Before starting, make sure you have [Gambit installed](#test-your-tests-with-gambit) on your machine.

2. Clone the repository of the article: `git clone https://github.com/ibourn/gambit-mutation-testing`

3. Navigate to the project directory: `cd gambit-mutation-testing`

4. Then execute the following commands to install all necessary dependencies:

   `forge install` (installs dependencies related to Foundry).

   `npm install` (installs dependencies necessary for the script).

### Application:

To create the mutations, run the command: `gambit mutate --json gambitconfig.json`

The `gambitconfig.json` file just indicates the contract on which to perform the mutations and specifies where to look for dependencies in the project. Thus, there are no restrictions on the types of mutations or the code to mutate here.

After execution, you will find a folder named `gambit_out` in your directory, as previously mentioned. This folder, for our example, contains 14 mutants generated by Gambit, each representing a variation of your initial code.

### Code Coverage Analysis:

Before proceeding further and to understand the usefulness of mutation tests, we will evaluate the coverage of our tests, launch the following command: `forge coverage`

You should see a coverage of 100% for the first column of your coverage report.

```
| File             | % Lines       | % Statements  | % Branches   | % Funcs       |
|------------------|---------------|---------------|--------------|---------------|
| src/Ticketer.sol | 100.00% (5/5) | 70.00% (7/10) | 50.00% (3/6) | 100.00% (2/2) |
| Total            | 100.00% (5/5) | 70.00% (7/10) | 50.00% (3/6) | 100.00% (2/2) |
```

Although this does not mean that your test is perfect or that all branches are covered, a 100% coverage in this column is a positive indicator, suggesting that your lines of code are fully traversed during the tests. This will be our starting point.

## Automating Mutation Testing with Foundry

Although Gambit is a powerful tool for generating mutants from your smart contracts, unlike vertigo-rs, it does not support automatic execution of tests on these mutants. This means that, without additional automation, executing tests on a large number of mutants, replacing mutated files one by one, can become a tedious and time-consuming task, particularly for large-scale or complex projects.

To overcome this limitation, automation using scripts can greatly facilitate and speed up the process.

### Example of an Automation Script:

In the [previously cloned repository](#prerequisites-and-installation), you will find the `mutationTest.js` script. If you wish to use it in another project, simply [copy it](https://github.com/ibourn/gambit-mutation-testing/blob/main/mutationTest.js) to the root of your project and install its dependencies with: `npm install fs-extra yargs colors`.

The script uses the `forge test` command from Foundry to launch the tests. Make sure to use it in a Foundry project.
It will place each of the mutants created by Gambit into your `src` folder one by one and launch the tests, then restore your original files.

**This is a simple demonstration script, so only use it on a real project after you have studied it to ensure it meets your needs.** Many improvements are possible, so feel free to make suggestions!

#### Script Options to Refine Test Execution:

- **--help :** Displays details and help on using the script.
- **--matchContract "<pattern_contract>" :** Allows specifying a regex pattern to select test contracts to use with the `--match-contract` option of the `forge test` command.
- **--noMatchContract "<pattern_contract>" :** Allows specifying a regex pattern to exclude test contracts to use with the `--no-match-contract` option of the `forge test` command.
- **--matchTest "<pattern_test>" :** Similar to --matchContract, but for filtering test functions to run with the `--match-test` option of the `forge test` command.
- **--noMatchTest "<pattern_test>" :** Similar to --matchContract, but to exclude test functions to run with the `--no-match-test` option of the `forge test` command.
- **--matchMutant "<pattern_source>" :** Filters mutated source files, allowing to restrict the mutants tested without modifying the configuration file of Gambit. (e.g., for a project containing several files including SimpleStorage.sol for which 10 mutants are generated, `--matchMutant SimpleStorage` allows testing only these 10 mutants).
- **--verbose true :** Displays in console the details of operations performed as well as the outputs from Foundry.
- **--debug true :** Copies the details of operations performed as well as the outputs from Foundry into logs located in the `testLogs` folder.

By default, without specific options, the `forge test` command will be launched for each mutant on all your tests.

**Tip:** To ignore specific mutants, you can mark the mutations you wish to exclude in the `mutants.log` file generated by Gambit, by placing a '**-**' in front of each mutation line. The script will use this file to identify mutants to exclude, which can be useful for **ignoring equivalent mutants**, for example.

#### Results and Logs:

After [generating the mutants](#application), use the following command in your terminal:

`node ./mutationTest.js`

The terminal will display the progress of the tests, then a summary including the total number of mutants, the number of mutants ignored (according to your filters), the number of mutants tested, the number of mutants "killed", and the number of survivors. Finally, the list of possible survivors will be indicated.  
A `testLogs` folder will be created and will contain a copy of the summary and the logs of the tests if the --debug option is used.

```
Tests over mutants run in : 0h 0m 35s 340ms

with command : forge test

Mutants skipped in 'mutants.log': none
Mutants skipped not matching mutant pattern: none
Mutants skipped due to no matching test pattern: none

Total of mutants : 14, skipped : 0, tested : 14 of which killed : 10, survived : 4
Mutation score: 71.43%
Undetected mutants: 2,4,12,14
```

In our example, you should obtain a mutation score of 71.43% and a list of surviving mutants: 2, 4, 12, 14.

This indicates that some modifications to our code do not result in any changes in the behavior of our tests. Even though all lines appear to be traversed according to the coverage, our tests are nonetheless not effective enough.

We then need to correct them or add new ones to kill our mutants (ensure that the tests fail in the presence of mutations).

In our example:

- Mutant 2 indicates that we do not test the case `amount == 0` for the `buyTicket` function.
- Mutant 4 survives because we do not test for an invalid sent value.
- Mutant 12 does not cause our tests to fail because we do not verify the number of tickets purchased.
- Mutant 14 indicates that we do not test the case of a failed transfer in `ownerCollect`.

In the cloned project, you will find comments suggesting corrections to eliminate our mutants. If you want to quickly see the impact on mutation tests, simply uncomment the tests in the test file.

If you uncomment all the corrections, you will achieve a mutation score of 100%, indicating that all lines are tested more effectively. A new `forge coverage` will also show improved coverage:

```
| src/Ticketer.sol | 100.00% (5/5) | 100.00% (10/10) | 100.00% (6/6) | 100.00% (2/2) |
| Total            | 100.00% (5/5) | 100.00% (10/10) | 100.00% (6/6) | 100.00% (2/2) |
```

## Future Perspectives

Depending on the tests you want to perform and the complexity of your project, multiple additions and optimizations can be made to this script. More broadly, a few improvement paths could be considered:

- **Parallelization of mutant tests:** Running tests on mutants in parallel can significantly reduce the overall execution time, provided that isolation between tests is carefully managed to prevent any interference.
- **Use of artificial intelligence to prioritize mutants:** Implementing machine learning algorithms to analyze the code and prioritize mutants based on their likelihood of inducing errors could optimize the testing process by focusing on the mutations most likely to be significant.

It should be noted that work on integration with Foundry seems to be continuing, as shown in this [article](https://hackmd.io/@tICezjHsSaiehIn9jbcUAA/SkTEyvuHa).

The union of Gambit and Foundry's forces could pave the way for more robust and intuitive testing tools, making development on Solidity both safer and more efficient. Let's stay tuned for the next updates from these teams!

## Conclusion

Mutation testing represents an additional step in validating the security of smart contracts, adding a layer of verification that goes beyond traditional methods. By making these tests accessible, Certora's Gambit plays a significant role in improving our blockchain development practices, with a focus on the security and reliability of the code.

Nevertheless, it is important to recognize that the full implementation of these tests can be time-consuming and resource-intensive, particularly in a context where deadlines are tight and resources are limited. Therefore, it is crucial to adopt a pragmatic approach, tailoring testing strategies to the specifics of each project. This involves finding a balance between the comprehensiveness of mutation testing and the efficiency of the development process, to optimize the time dedicated to the testing phase without compromising the quality and security of the code.

Just as in critical fields such as embedded systems, healthcare, or finance, where even minor failures can have serious consequences, blockchain development requires a meticulous approach and comprehensive testing solutions. Unlike applications like games, where the stakes are lower, smart contracts often manage significant amounts and are immutable once deployed. This characteristic makes errors irreversible and underscores the importance of rigorous and preventative testing practices.

Ultimately, mutation tests are not an end in themselves, but rather one tool among others in the arsenal of the smart contract developer, intended to enhance confidence in the quality and safety of decentralized applications. By judiciously integrating these tests into the development lifecycle, we can not only meet the highest security requirements but also contribute to advancing quality standards within the blockchain ecosystem.

---

Credits: [**Igor Bournazel**](https://www.linkedin.com/in/igor-bournazel/)

Thanks to [_Franck Maussand_](mailto:franck@maussand.net) for his suggestions and review of this article.

---

## Resources / Appendices

### Fundamentals of Software Development and Testing

- **Test-Driven Development (TDD):**

  - [Guide pratique du TDD en développement web (FR)](https://fr.agilitest.com/blog/practical-guide-to-test-driven-development-tdd-in-web-development)
  - [What Is Test Driven Development (TDD) (GB)](https://www.lambdatest.com/learning-hub/test-driven-development)

- **Unit Tests:**

  - [Introduction aux tests unitaires (FR)](https://welovedevs.com/fr/articles/tests-unitaires/)
  - [What Is Unit Testing? (GB)](https://builtin.com/software-engineering-perspectives/unit-testing)

- **Fuzzing :**

  - [Fuzzing sur Wikipedia (FR)](https://fr.wikipedia.org/wiki/Fuzzing)
  - [Fuzz Testing Expliqué (GB)](https://testfully.io/blog/fuzz-testing/)

- **Integration Tests:**

  - [Introduction aux tests d'intégration (FR)](https://yogosha.com/fr/blog/test-integration/)
  - [Qu'est-ce que le test d'intégration ? (GB)](https://www.codecademy.com/resources/blog/what-is-integration-testing/)

- **Mutation Testing:**

  - [Mutation Testing : un pas de plus vers la perfection (FR)](https://blog.octo.com/mutation-testing-un-pas-de-plus-vers-la-perfection)
  - [Mutation Testing: Its Concepts With Best Practices (GB)](https://www.lambdatest.com/learning-hub/mutation-testing)

- **Design by contract and Invariants:**

  - [La programmation par contrat (FR)](https://fr.wikipedia.org/wiki/Programmation_par_contrat)
  - [Design by contract (GB)](https://en.m.wikipedia.org/wiki/Design_by_contract)
  - [Invariant de boucle (FR)](https://fr.wikipedia.org/wiki/Invariant_de_boucle)

- **Stateful Fuzzing and Foundry:**

  - [Invariant Testing: Enter the Matrix (GB)](https://medium.com/cyfrin/invariant-testing-enter-the-matrix-c71363dea37e)
  - [Fuzzing et test d'invariants avec Foundry (GB)](https://www.cyfrin.io/blog/smart-contract-fuzzing-and-invariants-testing-foundry)
  - [Invariant Testing en Solidity (GB)](https://www.rareskills.io/post/invariant-testing-solidity)

- **Static Analysis and Slither:**

  - [Analyse statique de programmes sur Wikipedia (FR)](https://fr.wikipedia.org/wiki/Analyse_statique_de_programmes)
  - [Slither (GB)](https://github.com/crytic/slither)
  - [Qu'est-ce que l'analyse statique ? (GB)](https://www.perforce.com/blog/sca/what-static-analysis)

- **Formal Verification:**
  - [Vérification formelle (FR)](https://fr.wikipedia.org/wiki/V%C3%A9rification_formelle)
  - [Vérification formelle des smart contracts (GB)](https://ethereum.org/en/developers/docs/smart-contracts/formal-verification/)
  - [Symbolic Testing with Halmos (GB)](https://a16zcrypto.com/posts/article/symbolic-testing-with-halmos-leveraging-existing-tests-for-formal-verification/)

### Tools and Technologies

- [Gambit and Vertigo-rs presentation video](https://www.youtube.com/watch?v=HIN8lmj597M)
- [Gambit](https://github.com/Certora/gambit)
- [Vertigo-rs](https://github.com/RareSkills/vertigo-rs)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [rust](https://www.rust-lang.org/tools/install)
- [solc](https://docs.soliditylang.org/en/latest/installing-solidity.html)
- [solc-select](https://github.com/crytic/solc-select)
