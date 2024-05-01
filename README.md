# Au-delà de la couverture : Vaincre les mutants cachés dans votre code

## Table des matières

- [Introduction](#introduction)
- [Contexte de la blockchain](#contexte-de-la-blockchain)
- [L'Importance des tests dans le développement de smart contracts](#limportance-des-tests-dans-le-d%C3%Aveloppement-de-smart-contracts)
  - [Exploration des différents types de tests](#exploration-des-diff%C3%Arents-types-et_méthodes-de-tests)
    <!-- - [Test driven development (TDD)](#test-driven-development)
    - [Tests unitaires](#tests-unitaires)
    - [Le fuzzing](#le-fuzzing)
    - [Tests d'invariants](#tests-dinvariants)
    - [Analyse Statique](#analyse-statique)
    - [Vérification formelle](#v%C3%Arification-formelle) -->
  - [Différents environnements de test](#diff%C3%Arents-environnements-de-test)
  - [Métriques de test dans le développement](#m%C3%Atriques-de-test-dans-le-d%C3%Aveloppement)
    <!-- - [Qu'est-ce que la couverture de code ?](#quest-ce-que-la-couverture-de-code)
    - [Une couverture complète signifie-t-elle des tests de qualité ?](#une-couverture-complète-signifie-t-elle-des-tests-de-qualit%C3%A) -->
- [Les tests de mutations](#les-tests-de-mutations)
  - [Origine et principe](#origine-et-principe)
  - [Fonctionnement des tests de mutations](#fonctionnement-des-tests-de-mutations)
  - [Pourquoi les tests de mutations sont importants ?](#pourquoi-les-tests-de-mutations-sont-importants)
- [Testez vos tests avec Gambit!](#testez-vos-tests-avec-gambit)
  - [Prérequis d'installation](#pr%C3%Arequis-dinstallation)
  - [Installation et configuration de Gambit](#installation-et-configuration-de-gambit)
  - [Création des mutants](#cr%C3%Aation-des-mutants)
  - [Les sorties produites par Gambit](#les-sorties-produites-par-gambit)
  - [Limitations des tests de mutation](#limitations-des-tests-de-mutation-avec-gambit)
- [Mise en pratique avec un exemple](mise-en-pratique-avec-un-exemple)
- [Automatisation des tests de mutation avec Foundry](#automatisation-des-tests-de-mutation-avec-foundry)
  - [Exemple de script d'automatisation](#exemple-de-script-dautomatisation)
    <!-- - [Options du script](#options-du-script)
    - [Résultats et logs](#r%C3%Asultats-et-logs) -->
- [Perspectives futures](#perspectives-futures)
- [Conclusion](#conclusion)

## TL;DR

- Les tests sont essentiels pour assurer la sécurité des smart contracts.
- Une couverture de test élevée ne garantit pas l'absence de failles.
- Les tests de mutation évaluent la robustesse de nos tests en introduisant des modifications ciblées dans le code pour voir si elles sont détectées.
- Gambit se distingue comme un outil précieux pour la réalisation des tests de mutation, en facilitant la création de mutants.
- Que vous soyez débutant ou expert, l’adoption des tests de mutation peut grandement renforcer la sécurité et la fiabilité de vos contrats.

## Introduction

Vous avez atteint une couverture de test de 100% ? Félicitations ! Mais avez-vous réellement éliminé tous les mutants ? En d’autres termes, vos tests sont-ils capables de détecter des altérations délibérées de votre code qui pourraient introduire des erreurs ? Loin d'être une simple corvée, les tests jouent un rôle crucial dans le développement des applications, y compris des smart contracts. Diverses métriques sont utilisées pour évaluer la qualité de nos tests, cherchant souvent à atteindre une couverture de code totale. Mais cela suffit-il à garantir leur pertinence et leur efficacité ? Une solution existe : tester nos tests pour obtenir une véritable mesure de la qualité de notre arsenal de tests.

Récemment, grâce à une [vidéo](https://www.youtube.com/watch?v=HIN8lmj597M) de Owen Thurm, j'ai découvert l'outil [Gambit de Certora](https://github.com/Certora/gambit), qui automatise la génération de mutations pour les contrats écrits en Solidity. Les tests de mutations demeurent largement sous-documentés, notamment dans le domaine de la blockchain, ce qui en fait un sujet méritant d'être davantage exploré et exposé.

Dans la suite de cet article, nous explorerons leur concept et leur utilité dans une suite de tests traditionnelle, avant de présenter un guide pratique pour installer et utiliser Gambit. Puis un script permettant d'automatiser les tests de mutations sera mis à disposition, ainsi qu'un dépôt reproduisant l'exemple de la vidéo. Cela offrira aux lecteurs la possibilité de suivre l'exemple, dans l'espoir que ces ressources pratiques faciliteront leur découverte de l'outil.

## Contexte de la blockchain

Avant d'entrer dans le détail, il est essentiel de rappeler le contexte unique dans lequel la blockchain opère. Sa principale caractéristique, l'immuabilité, signifie qu'une fois un contrat déployé, il ne peut plus être modifié. Cette permanence rend cruciale la sécurité des contrats déployés, car toute faille ou bug non détecté pourrait être exploité, en particulier dans des secteurs tels que la DeFi, où les motivations financières sont élevées.

Selon un [rapport récent](https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2024/), en 2023, les fonds dérobés à la suite de hacks ont diminué d'environ 54.3%, pour atteindre 1.7 milliard de dollars. Cependant, le nombre d'incidents de piratage individuels a en fait augmenté, passant de 219 en 2022 à 231 en 2023. Cette augmentation des incidents, malgré une baisse du montant total dérobé, souligne l'importance de renforcer les mesures de sécurité. Si nous aspirons à une adoption massive de la blockchain, une attention particulière doit être portée à la sécurité dès le début du processus de développement.

Pour adresser ces enjeux, la communauté s'appuie sur des audits de code, des programmes de bug bounty, et d'autres pratiques rigoureuses dès la conception des contrats. Cependant, ces mesures, bien qu'essentielles, ne suffisent pas toujours à garantir une sécurité à toute épreuve. Il est donc crucial d'adopter une approche proactive et d'intégrer des techniques de sécurité avancées dès les premières étapes de développement des contrats intelligents.

## L'Importance des tests dans le développement de smart contracts

### Exploration de différents types et méthodes de tests

Afin d'assurer la sécurité et la fiabilité des smart contracts, divers types de tests et pratiques sont employés. Il est important de noter que bien que nous nous concentrions sur le développement blockchain dans cet article, les concepts et méthodes de test mentionnés ici ont été établis et appliqués dans le domaine du développement logiciel en général depuis longtemps. Ces pratiques sont fondamentales pour assurer la qualité et la sécurité dans tous les types de développement logiciel. La liste présentée ci-dessous n'est pas exhaustive, mais met en lumière certaines des pratiques et outils de test les plus couramment utilisés dans le développement blockchain :

- **Test driven development (TDD) :** Cette méthode encourage la rédaction des tests avant le développement proprement dit de la fonctionnalité. Elle vise à clarifier les objectifs du code dès le départ. En adoptant cette stratégie, le développeur s'engage à façonner le code pour qu'il satisfasse immédiatement aux exigences établies.

- **Tests unitaires :** Ils permettent de vérifier l'exécution correcte des plus petites unités d'un smart contract, telles que les fonctions ou méthodes, de manière isolée.

- **Tests d'intégration :** Ces tests visent à évaluer le fonctionnement du smart contract en interaction avec d'autres contrats ou composants du système. Ils permettent de s'assurer que l'ensemble des pièces fonctionne correctement ensemble. Imaginez que vous construisez une montre : les tests d'intégration vérifient non seulement que chaque rouage tourne correctement, mais aussi que tous les rouages fonctionnent bien ensemble pour donner l'heure exacte. Ces tests simulent des interactions complexes pour détecter d'éventuelles erreurs dans les interfaces ou dans la logique d'intégration.

- **Le fuzzing :** Cette technique consiste à soumettre les fonctions du contrat à une multitude d'entrées aléatoires pour découvrir des comportements inattendus ou des vulnérabilités. Elle permet d'explorer un large éventail de scénarios potentiels et de s'assurer de la robustesse des fonctions face à des entrées imprévues.

- **Tests d'invariants :** Ces tests, catégorie d'une approche plus large qu'est la programmation par contrat, vérifient que certaines propriétés ou règles cruciales du contrat restent constantes avant et après l'exécution des transactions, comme la quantité totale de tokens (total supply) devant rester inchangée par exemple. Ces tests aident à assurer que le contrat fonctionne comme prévu sous diverses conditions.

- **Fuzzing d'état (Stateful Fuzzing) :** Cette technique ne se contente pas de tester des entrées aléatoires, mais génère également des séquences aléatoires d'appels de fonctions, tout en conservant les changements d'états intermédiaires. Cela permet de tester le contrat de manière exhaustive, en couvrant des interactions complexes et des chemins d'exécution qui pourraient rester inexplorés avec des méthodes plus traditionnelles. Le fuzzing d'état est ainsi particulièrement utile pour garantir la robustesse des invariants sous diverses conditions et pour évaluer la résilience globale du système.

- **Analyse statique :** Cette méthode examine le code source du contrat sans l'exécuter, en scrutant chaque ligne de code, elle vise à identifier des erreurs de programmation, des failles de sécurité ou des vulnérabilités potentielles. Elle peut révéler des problèmes comme des boucles infinies, des appels de fonctions dangereuses ou des chemins d'exécution qui pourraient mener à un comportement inattendu...

- **Vérification formelle :** Elle se base sur la création d'un modèle mathématique pour représenter le code et vérifier certaines propriétés ou invariants pour prouver mathématiquement que le comportement d'un code correspond à nos attentes dans tous les cas possibles. Dans le monde blockchain, la plus répandue des techniques utilisées est l'exécution symbolique. Cette dernière consiste à parcourir tous les chemins possibles dans un programme, en convertissant ces chemins en expressions mathématiques. Ensuite, un solveur d'équations examine ces expressions pour voir si nos propriétés tiennent ou pas. La vérification formelle cherche des preuves mathématiques que nos propriétés sont soit toujours vraies, soit potentiellement fausses.
  Pour imager cela, imaginons que votre code soit un labyrinthe. Chaque décision, chaque opération et interaction dans le code crée une bifurcation, offrant de multiples chemins possibles. Ces différents chemins sont représentés par des symboles, permettant de les explorer de manière théorique. On peut alors simuler tous les parcours envisageables et s'assurer que le code atteint toujours les résultats attendus.

### Différents environnements de tests

Les tests mentionnés ci-dessus sont exécutés dans différents environnements afin de simuler diverses conditions d'utilisation :

- **Local :** Les tests sont d'abord réalisés en local, sur la machine du développeur. Cela permet de tester le code isolément, dans un environnement contrôlé.

- **Forked environment :** Après les tests locaux, on utilise souvent un environnement qui réplique une blockchain existante. Cela permet de tester les interactions du contrat avec d'autres contrats dans un contexte qui simule la réalité, mais sans les risques associés à la blockchain principale.

- **Testnet :** Les contrats sont ensuite déployés sur un testnet, qui est une blockchain de test permettant de simuler des conditions plus proches de la production, y compris les interactions avec des entités extérieures simulées (mocked).

- **Staging environment (ou "préproduction") :** Enfin, suivant les conditions, un environnement de staging permet de déployer et de tester les contrats dans des conditions quasi identiques à celles de la production, y compris les temps d'exécution et les frais de transaction.

Ces différentes étapes permettent de s'assurer que le contrat est robuste et prêt pour le déploiement en production, minimisant ainsi les risques d'erreurs ou de vulnérabilités.

### Métriques de test dans le développement

#### Qu'est-ce que la couverture de code ?

Dans le monde du développement blockchain, où la sécurité et la fiabilité sont primordiales, les tests unitaires et le fuzzing représentent le strict minimum pour vérifier l'intégrité des smart contracts. Cependant, au-delà de l'application de ces tests, comment pouvons-nous évaluer la qualité de nos tests ? C'est là que les métriques de test, et plus particulièrement la mesure de la couverture de code, entrent en jeu.

La couverture de code, appelée "coverage" en anglais, est la principale métrique utilisée pour évaluer les tests automatisés. Elle mesure le pourcentage de votre code qui est exécuté lors de l'exécution de vos tests. Plus précisément, elle peut se décomposer en plusieurs types :

- Couverture de ligne : Ce type mesure si chaque ligne de code dans votre smart contract a été exécutée au moins une fois pendant les tests.
- Couverture de branche : Elle vérifie si chaque condition dans votre code (par exemple, les instructions if et switch) a été testée dans tous ses résultats possibles (true/false).
- Couverture de fonction : Elle s'assure que chaque fonction ou méthode dans votre code a été appelée durant les tests.

Le but est d'atteindre une couverture de 100%, ce qui signifierait théoriquement que chaque partie du code a été testée. Mais cela soulève une question importante : est-ce que cette couverture garantit la qualité de nos tests?

#### Une Couverture complète signifie-t-elle des tests de qualité ?

Atteindre une couverture de 100% est un objectif louable, mais cela ne garantit pas nécessairement que le code est bien testé. Pourquoi ? Parce que la couverture de code mesure la quantité du code qui est testée, pas la qualité des tests eux-mêmes. Une ligne de code peut être "couverte" si elle est exécutée lors d'un test, mais cela ne signifie pas que le test vérifie correctement le comportement ou le résultat de cette ligne. Autrement dit, un test peut passer sur une ligne de code sans pour autant détecter un comportement incorrect ou une faille de sécurité.
C'est pourquoi il est crucial de ne pas se reposer uniquement sur la couverture de code comme indicateur de la qualité des tests. Il faut également s'assurer que les tests sont bien conçus, qu'ils testent les bons scénarios, et qu'ils vérifient les comportements attendus du code. C'est là que les tests de mutations, abordés dans la section suivante, entrent en jeu en nous aidant à évaluer l'efficacité réelle de nos tests et à identifier les potentiels angles morts avec une autre métrique : le mutation score.

## Les Tests de mutations

Les tests de mutation constituent une méthode avancée pour évaluer la robustesse des suites de tests unitaires. En modifiant légèrement le code source (mutations), cette approche permet de vérifier si les tests existants sont capables de détecter ces changements — autrement dit, si nos tests sont suffisamment sensibles pour identifier des erreurs potentielles.

### Origine et principe

Inventée en 1971 par Richard Lipton, la technique des tests de mutation a été conçue pour mesurer l'efficacité des tests sans nécessiter d'écriture de code supplémentaire (ou presque). Au fil des années, elle s'est établie comme un outil précieux pour affiner et valider la couverture des tests unitaires.

Au cœur des tests de mutation se trouve l'idée de "maladie" du code : des modifications délibérées (mutations) sont appliquées au code source pour créer des versions légèrement altérées ("mutants"). La capacité des tests existants à détecter et à échouer en raison de ces mutations révèle l'efficacité et la complétude de la suite de tests. En d'autres termes, si un mutant survit (c'est-à-dire, si les tests continuent de passer malgré la mutation), cela indique une lacune dans la couverture des tests.

### Fonctionnement des tests de mutations

Le processus implique la création de "mutants" par modification légère du code original,
Les mutations appliquées au code peuvent être de différentes formes, dont, par exemple :

- La modification de la valeur d’une constante : Par exemple, changer un `const int MAX_VALUE = 10;` en `const int MAX_VALUE = 0;` pour voir si les tests détectent le changement.
- Le remplacement d’opérateurs : Remplacer, par exemple, un opérateur d'addition (+) par un opérateur de soustraction (-) dans une expression mathématique.
- La suppression d’instructions : Comme retirer un appel de fonction pour tester l'impact de son absence sur le comportement du programme.
- La mutation des conditions dans les instructions de contrôle : Cette technique consiste à modifier les conditions dans les structures de contrôle, comme transformer un `if (condition)` en `if (!condition)`, ou encore ajuster un comparateur `<` en `==`, `>`, ou `>=`. L'objectif est d'explorer et de tester la réaction du code face à toutes les formes possibles que peut prendre une condition, afin de s'assurer que les cas alternatifs sont correctement gérés.
- La modification des retours de fonctions : Changer le retour d'une fonction pour retourner une valeur fixe ou incorrecte, afin de tester la réaction des composants qui dépendent de cette fonction.
- L'élimination de branches dans des structures conditionnelles : Supprimer une branche else ou un cas dans un switch

Les tests sont alors lancés sur le code avec une mutation à la fois.

Si un test échoue à cause d'une mutation, cela indique que nos tests ont repéré la mutation et donc une bonne couverture de test pour cette partie du code.
Si les tests restent au vert malgré les mutations du code, alors ils ne suffisent pas à détecter la régression amenée par le mutant. On parle dans ce cas de mutations survivantes. A l’inverse, si au moins un test passe au rouge lors de l'exécution d’un code muté, alors la mutation est dite tuée (sous entendu par le test).

### Pourquoi les tests de mutations sont importants ?

Les tests de mutation sont un outil puissant pour évaluer la qualité des tests existants. En vérifiant si ces tests sont capables de détecter des erreurs délibérément introduites, ils permettent d'identifier d'éventuels angles morts dans les tests ou des bugs potentiels dans le code. Cela accroît la confiance dans la capacité des tests à couvrir efficacement le code et à détecter les erreurs potentielles

**Exemple en pseudo-code :**
Supposons que nous ayons la fonction suivante pour une illustration très basique :

```
fonction estEligiblePourInscription(age)
    si age >= 18
        retourner vrai
    sinon
        retourner faux
```

Et voici un test basique pour cette fonction :

```
test_estEligiblePourInscription()
    assert(estEligiblePourInscription(20) == vrai)  // Test pour un utilisateur éligible
    assert(estEligiblePourInscription(16) == faux)  // Test pour un utilisateur non éligible
```

Ce test vérifie si la fonction retourne correctement vrai pour un utilisateur de 20 ans et faux pour un utilisateur de 16 ans.

Supposons que nous introduisions maintenant une mutation très subtile dans la fonction :

```
fonction estEligiblePourInscription(age)
    si age > 18  // Mutation : changement de l'opérateur de >= à >
        retourner vrai
    sinon
        retourner faux
```

Avec cette mutation, la fonction retournerait incorrectement faux pour un utilisateur exactement âgé de 18 ans, violant ainsi la règle d'éligibilité initiale. Mais le test actuel ne le remarquerait pas., il resterait au vert. On aurait alors un mutant survivant.

Pour détecter cette mutation et s'assurer que la condition d'âge est correctement testée, nous devons ajouter un cas de test spécifique pour l'âge limite :

```
test_estEligiblePourInscription_ageLimite()
    assert(estEligiblePourInscription(18) == vrai)  // Ce test échouerait avec la fonction mutée
```

Ce test supplémentaire permettrait de détecter la mutation introduite et de s'assurer que le cas limite d'un utilisateur âgé de 18 ans est correctement géré par la fonction.

## Testez vos tests avec Gambit!

Dans le paysage en constante évolution du développement blockchain, une variété d'outils a été mise au point pour optimiser et sécuriser le processus de création, ainsi, il existe de nombreux outils destinés à faciliter les tests, et concernant les tests de mutation nous pouvons citer : [**Vertigo-rs**](https://github.com/RareSkills/vertigo-rs) maintenu par Jeffrey Scholz de [RareSkills](https://www.rareskills.io/). D'utilisation plus simple il permet de lancer les tests automatiquement mais semble générer, pour le moment, moins de mutations. C'est pourquoi notre attention se porte sur **[Gambit](https://github.com/Certora/gambit)**, un outil développé par [Certora](https://www.certora.com/), une entreprise de sécurité fournissant des services d'audit et mettant à disposition une solution de vérifications formelles en plus de Gambit.

Dans cette section, nous allons résumer l'utilisation de l'outil Gambit pour une prise en main rapide. Nous prendrons délibérément l'exemple de la vidéo mentionnée en introduction, afin que ceux qui le souhaitent puissent suivre et avoir le code sous les yeux. Bien qu'il existe de nombreuses options disponibles dans la [documentation de Gambit](https://github.com/Certora/gambit), nous nous concentrerons sur celles qui permettent une utilisation immédiate et simple.

### Prérequis d'installation

Avant de commencer à utiliser Gambit, vous devez vous assurer que certains outils sont installés sur votre système :

- **Rust** : Gambit étant écrit en Rust, vous devez donc avoir installé [rust](https://www.rust-lang.org/tools/install).
  Assurez-vous que l'installation a été réalisée avec succès en ouvrant un terminal et en exécutant `rustc --version`.

- **Solc** : Le compilateur Solidity, [solc](https://docs.soliditylang.org/en/latest/installing-solidity.html), est également nécessaire pour la génération des mutants. Vous devez avoir des binaires de solc compatibles avec votre projet aussi afin de gérer différentes versions vous pouvez préférez l'usage de [solc-select](https://github.com/crytic/solc-select).
  Confirmez l'installation en exécutant `solc --version` dans un terminal.

### Installation et configuration de Gambit

Une fois les prérequis installés, vous pouvez suivre une des différentes [méthodes d'installation](https://github.com/Certora/gambit?tab=readme-ov-file#installation). Nous allons choisir, ici, de cloner le dépôt.

- **Clonez le dépôt de Gambit :**

  ```bash
  git clone https://github.com/Certora/gambit.git
  ```

- **Puis, installez Gambit avec Cargo :**
  Naviguez dans le répertoire cloné de Gambit et exécutez la commande suivante :

  ```bash
  cargo install --path .
  ```

Cette commande installe Gambit sur votre système et l'ajoute à votre PATH, vous permettant de l'invoquer depuis n'importe quel répertoire.

### Création des mutants

Gambit offre deux commandes principales : `mutate` et `summary`. La première génère des mutants, tandis que la seconde fournit un résumé des mutations effectuées. Cet article se penchera sur l'utilisation de mutate. Selon la [documentation de Gambit](https://docs.certora.com/en/latest/docs/gambit/gambit.html#mutation-types), l'outil propose une multitude d'options permettant de spécifier des paramètres nécessaires à solc, de limiter les mutations, et de filtrer les fichiers, contrats, et fonctions à muter. Par défaut, en l'absence d'options spécifiques, Gambit effectuera des mutations sur l'ensemble des fonctions de tous les contrats, en appliquant tous les types de mutations disponibles.

Pour une gestion plus efficace et organisée, il est possible d'utiliser un fichier de configuration. Voici un exemple :

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

Chaque entrée dans ce fichier correspond à une spécification pour effectuer des mutations d'un fichier donné. Pour un contrat et le chemin vers son fichier vous avez la possibilité de préciser les fonctions à muter, le type de mutations à appliquer, ainsi que des informations spécifiques à solc (comme la version à utiliser et le remapping pour localiser les dépendances).
Dans l'exemple, seuls les fichiers `Ticketer.sol` et `Blip.sol` seront utilisés pour fabriquer des mutants. Pour `Ticketer` toutes les fonctions seront visitées et tout les types de mutations possible seront appliqués. Pour `D` nous spécifions ne vouloir considérer que la fonction `bang` et les mutations de type : `binary-op-mutation`
et `swap-arguments-operator-mutation`.

Pour appliquer ce fichier de configuration, vous devez utiliser l'option `--json` avec la commande suivante :

`gambit mutate --json ./gambitconfig.json`

Cette approche permet une personnalisation avancée de la génération de mutants, s'adaptant à la complexité et aux besoins spécifiques de vos projets.

### Les Sorties produites par Gambit

Lorsque vous utilisez `Gambit` pour générer des mutants, l'outil crée un dossier `gambit_out` qui sert de répertoire central pour toutes les données générées durant le processus de mutation. Voici un aperçu des éléments clés que vous y trouverez :

- **Dossier mutants/ :** Il contient tous les mutants générés, organisés de manière à refléter l'arborescence du contrat original. Chaque mutant est placé dans un répertoire individuel, nommé d'après son ID de mutant, par exemple, 1, 2, 3, etc. Cette structure facilite l'identification et l'examen de chaque mutation spécifique. Dans chaque fichier Gambit ajoute une ligne de commentaire précisant la mutation qu'il a effectué à l'endroit où il l'a faite.

- **Fichier mutants.log :** Il fournit un journal de chaque mutation appliquée. Pour chaque entrée, vous trouverez le numéro du mutant (correspondant à son répertoire dans mutants/), le type de mutation réalisée, la valeur d'origine, et la nouvelle valeur post-mutation.

- **Fichier gambit_results.json :** Un fichier JSON contenant les résultats détaillés de l'opération de mutation. Il s'agit d'une version plus détaillée du log précédent.

- **Dossier input_json/ :** Contient des fichiers intermédiaires produits par solc qui sont utilisés durant le processus de mutation. Ces fichiers servent de base pour la génération des mutants.

### Limitations des tests de mutation

L'une des premières limitations à prendre en compte lors de l'utilisation de tests de mutation, y compris avec Gambit, est la génération de ce que l'on appelle des "mutants équivalents". Ces mutants, bien que modifiés, n'entraînent aucun changement dans le comportement du code. Prenons l'exemple suivant :

```
int index = 0;
while(...) {
    ...;
    index++;
    if (index == 10) break;
}
```

Dans cet exemple, une mutation de l'opérateur `==` en `>=` ne modifierait pas le comportement du code. Ces **mutants équivalents** peuvent fausser votre score de mutation, il est donc judicieux de les ignorer. Pour cela, il pourrait être utile de marquer les lignes de mutations considérées comme inutiles.

De plus, il est important de souligner que, compte tenu de la taille et de la complexité du code, l'exécution de tests sur un grand nombre de mutants (disons 1000) pourrait prendre plusieurs heures. Il est donc essentiel de noter que lancer les tests de mutations sur l'ensemble du projet n'est pas une opération que l'on fait toutes les 5 minutes. Cette opération intervient à des moments clés de la phase de tests, nécessitant une planification minutieuse. Concevoir une stratégie pour vos campagnes de tests de mutation, en regroupant ou segmentant les tests, peut réduire la durée totale des tests et simplifier la correction des mutants survivants (gérer des centaines de survivants en même temps peut s'avérer peu pratique).

Même si les tests de mutation sont généralement conçus pour les tests unitaires, il est possible d'imaginer des stratégies pour les étendre à d'autres types de tests. Cependant, il convient de se demander si cela est véritablement pertinent et efficient dans le cadre de votre projet. Et surtout, il est crucial de prendre en considération le temps que cela nécessitera.

## Mise en pratique avec un exemple

Pour ceux parmi vous désireux d’expérimenter rapidement par eux-mêmes, je vous propose une démarche simple et concrète. Nous allons cloner le [dépôt lié à cet article](https://github.com/ibourn/gambit-mutation-testing) qui reproduit l'exemple de la vidéo citée en introduction. Ainsi, vous pourrez suivre le raisonnement de l'article, expérimenter avec du code réel tout en ayant, si besoin, un support vidéo détaillé.

Il s'agit d'un projet Foundry avec un contrat basique de vente de tickets. Les tests sont volontairement succints pour la démonstration. Dans le projet, vous trouverez également un script javascript qui est détaillé par la suite.

### Prérequis et Installation :

1. Avant de commencer, assurez-vous d'avoir [Gambit installé](#testez-vos-tests-avec-gambit) sur votre machine.

2. Clonez le dépôt de l'article : `git clone https://github.com/ibourn/gambit-mutation-testing`

3. Naviguez dans le répertoire du projet : `cd gambit-mutation-testing`

4. Puis exécutez les commandes suivantes pour installer toutes les dépendances nécessaires :

   `forge install` (installe les dépendances liées à Foundry).

   `npm install` (installe les dépendances nécessaires pour le script).

### Application :

Pour créer les mutations lancer la commande : `gambit mutate --json gambitconfig.json`

Le fichier de config `gambitconfig.json` indique juste le contrat sur lequel effectuer les mutations et précise où chercher les dépendances dans le projet. Il n'y a donc ici aucune restriction sur les types de mutations ou sur le code à muter.

Après l'exécution, vous trouverez un dossier nommé `gambit_out` dans votre répertoire, comme indiqué précédemment. Ce dossier, pour notre exmple, contient 14 mutants générés par Gambit, chacun représentant une variation de votre code initial.

### Analyse de la Couverture de Code :

Avant d'aller plus loin et afin de comprendre l'utilité des tests de mutations, nous allons évaluer la couverture de nos tests, lancez la commande suivante :
`forge coverage`

Vous devriez constater une couverture de 100% pour la première colonne de votre rapport de couverture.

```
| File             | % Lines       | % Statements  | % Branches   | % Funcs       |
|------------------|---------------|---------------|--------------|---------------|
| src/Ticketer.sol | 100.00% (5/5) | 70.00% (7/10) | 50.00% (3/6) | 100.00% (2/2) |
| Total            | 100.00% (5/5) | 70.00% (7/10) | 50.00% (3/6) | 100.00% (2/2) |
```

Si cela ne signifie pas que votre test soit parfait ni que toutes les branches soient couvertes, une couverture de 100% dans cette colonne est un indicateur positif, suggérant que vos lignes de code sont intégralement traversées pendant les tests. Ce sera notre point de départ.

## Automatisation des tests de mutation avec Foundry

Bien que Gambit soit un outil puissant pour générer des mutants à partir de vos contrats intelligents, à la différence de vertigo-rs, il ne prend pas en charge l'exécution automatique des tests sur ces mutants. Cela signifie que, sans automatisation supplémentaire, l'exécution de tests sur un grand nombre de mutants, en remplaçant les fichiers mutés un à un, peut devenir une tâche fastidieuse et chronophage, particulièrement pour des projets de grande envergure ou complexes.

Pour surmonter cette limitation, l'automatisation à l'aide de scripts peut considérablement faciliter et accélérer le processus.

### Exemple de script d'automatisation :

Dans le [dépôt cloné précédemment](#prérequis-et-installation) vous trouverez le script `mutationTest.js`, si vous souhaitez l'utiliser dans un autre projet, il vous suffit de le [copier](https://github.com/ibourn/gambit-mutation-testing/blob/main/mutationTest10.js) à la racine de votre projet puis d'installer ses dépendances avec : `npm install fs-extra yargs colors`.

Le script utilisant la commande `forge test` de Foundry pour lancer les tests, veillez à l'utiliser dans un projet Foundry.
Il va placer un à un les mutants créés par Gambit dans votre dossier `src` et lancer les tests, puis restaurer vos fichiers originaux.

**Il s'agit d'un simple script de démonstration, aussi ne l'utilisez sur un projet réel qu'après l'avoir étudié afin de vous assurer qu'il convient à vos besoins.** De nombreuses améliorations sont possibles, n'hésitez pas à proposer des suggestions!

#### Options du script pour affiner l'exécution des tests :

- **--help :** Affiche les détails et l'aide sur l'utilisation du script.
- **--matchContract "<pattern_contract>" :** Permet de spécifier un pattern regex pour sélectionner les contrats de test à utiliser avec l'option `--match-contract` de la commande `forge test`.
- **--noMatchContract "<pattern_contract>" :** Permet de spécifier un pattern regex pour exclure les contrats de test à utiliser avec l'option `--no-match-contract` de la commande `forge test`.
- **--matchTest "<pattern_test>" :** Similaire à --matchContract, mais pour filtrer les fonctions de test à exécuter avec l'option `--match-test` de la commande `forge test`.
- **--noMatchTest "<pattern_test>" :** Similaire à --matchContract, mais pour éxclure les fonctions de test à exécuter avec l'option `--no-match-test` de la commande `forge test`.
- **--matchMutant "<pattern_source>" :** Filtre les fichiers source mutés, permettant de restreindre les mutants testés sans modifier le fichier de configuration de Gambit. (ex : pour un projet contenant plusieur fichiers dont SimpleStorage.sol pour lequel sont générés 10 mutants, `--matchMutant SimpleStorage` permet de ne tester que ces 10 mutants).
- **--verbose true :** Affiche en console le détails des opérations effectuées ainsi que les sorties de Foundry.
- **--debug true :** Copie le détails des opérations effectuées ainsi que les sorties de Foundry dans des logs situés dans le dossier testLogs.

Par défaut, sans options spécifiques, la commande `forge test` sera lancée pour chaque mutant sur l'ensemble de vos tests.

**Astuce :** Pour ignorer des mutants spécifiques, vous pouvez marquer les mutations que vous souhaitez exclure dans le fichier `mutants.log` généré par Gambit, en plaçant un '**-**' devant chaque ligne de mutation. Le script utilisera ce fichier pour identifier les mutants à exclure, ce qui peut être utile pour **ignorer les mutants équivalents**, par exemple.

#### Résultats et logs :

Après avoir [généré les mutants](#création-des-mutants), utilisez la commande suivante dans votre terminal :

`node ./mutationTest.js`

Le terminal affichera la progression des tests, puis un résumé comprenant le nombre total de mutants, le nombre de mutants ignorés (selon vos filtres), le nombre de mutants testés, le nombre de mutants "tués" et le nombre de survivants. Enfin sera indiquée liste des survivants éventuels.  
Un dossier `testLogs` sera créé et contiendra une copie du résumé ainsi que les logs des tests si l'option --debug est utilisée.

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

Dans le cadre de notre exemple vous devriez obtenir un mutation score de 71.43% et la liste de mutants survivants : 2,4,12,14

Cela signifie que certaines modifications de notre code n'impliquent aucun changement de comportement de nos tests. Si toutes les lignes semblent être traversées d'après le coverage, nos tests ne sont cependant pas assez efficaces.

Il faut alors les corriger ou en ajouter afin de tuer nos mutants (faire en sorte que les tests echouent en présence de mutations).

Dans notre exemple :

- le mutant 2 nous indique nous ne testons pas le cas `amount == 0` pour la fonction `buyTicket`
- le mutant 4 survit car nous ne testons pas une valeur envoyée invalide.
- le mutant 12 ne fait pas échouer nos tests car nous ne vérifions pas le nombre de ticket achetés.
- le mutant 14 indique que nous ne testons pas le cas d'un transfert qui échoue dans `ownerCollect`.

Dans le projet clôné, vous trouverez en commentaires des corrections à apporter pour éliminer nos mutants. Si vous voulez voir rapidement l'impact sur les tests de mutations, il vous suffit de décommenter les tests dans le fichier de tests.

Si vous décommentez toutes les corrections. Vous obtiendrez un mutation score de 100%, vous savez alors que toutes les lignes sont téstés de façon plus efficace. Et un nouveau `forge coverage` indiquera également une meilleure couverture :

```
| src/Ticketer.sol | 100.00% (5/5) | 100.00% (10/10) | 100.00% (6/6) | 100.00% (2/2) |
| Total            | 100.00% (5/5) | 100.00% (10/10) | 100.00% (6/6) | 100.00% (2/2) |
```

## Perspectives futures

Suivant les tests que vous voulez effectuer et la complexité de votre projet, de multiples ajouts et optimisation peuvent être faites à ce script. Plus globalement quelques pistes d'amélioration pourrait être envisagées :

- Parallélisation des tests de mutants : exécuter des tests sur les mutants en parallèle peut considérablement réduire le temps d'exécution global, à condition de gérer soigneusement l'isolation entre les tests pour éviter toute interférence.
- Utilisation de l'intelligence artificielle pour prioriser les mutants : Implémenter des algorithmes d'apprentissage automatique pour analyser le code et prioriser les mutants en fonction de leur probabilité d'induire des erreurs pourrait optimiser le processus de test en se concentrant sur les mutations les plus susceptibles d'être significatives.

Il est à noter qu'il semblerait qu'un travail d'intégration avec foundy se poursuit comme le montre cet [article](https://hackmd.io/@tICezjHsSaiehIn9jbcUAA/SkTEyvuHa).

L'union des forces de Gambit et Foundry pourrait ouvrir la voie à des outils de test plus robustes et intuitifs, rendant le développement sur Solidity à la fois plus sûr et plus efficace. Restons attentifs aux prochaines mises à jour de ces équipes!

## Conclusion

Les tests de mutation représentent une étape supplémentaire dans la validation de la sécurité des contrats intelligents, ajoutant une couche de vérification qui va au-delà des méthodes traditionnelles. En rendant ces tests accessibles, Gambit de Certora joue un rôle significatif dans l'amélioration de nos pratiques de développement blockchain, en mettant un point d'honneur sur la sécurité et la fiabilité du code.

Néanmoins, il est important de reconnaître que la mise en œuvre complète de ces tests peut s'avérer chronophage et exigeante en ressources, particulièrement dans un contexte où les délais sont serrés et les ressources limitées. Il est donc primordial d'adopter une approche pragmatique, en adaptant les stratégies de test aux spécificités de chaque projet. Cela implique de trouver un équilibre entre l'exhaustivité des tests de mutation et l'efficacité du processus de développement, afin d'optimiser le temps consacré à la phase de tests tout en ne compromettant pas la qualité et la sécurité du code.

En fin de compte, les tests de mutation ne sont pas une fin en soi, mais plutôt un outil parmi d'autres dans l'arsenal du développeur de contrats intelligents, destiné à renforcer la confiance dans la qualité et la sûreté des applications décentralisées. En intégrant judicieusement ces tests dans le cycle de vie du développement, nous pouvons non seulement répondre aux exigences de sécurité les plus strictes mais aussi contribuer à l'avancement des standards de qualité au sein de l'écosystème blockchain.

---

Crédits : [**Igor Bournazel**](https://www.linkedin.com/in/igor-bournazel/)

Merci à [_Franck Maussand_](mailto:franck@maussand.net) pour ses suggestions et la relecture de cet article.

---

## Ressources / Annexes

### Fondamentaux du Développement et Test de Logiciels

- **Développement Piloté par les Tests (TDD) :**

  - [Guide pratique du TDD en développement web (FR)](https://fr.agilitest.com/blog/practical-guide-to-test-driven-development-tdd-in-web-development)
  - [What Is Test Driven Development (TDD) (GB)](https://www.lambdatest.com/learning-hub/test-driven-development)

- **Tests Unitaires :**

  - [Introduction aux tests unitaires (FR)](https://welovedevs.com/fr/articles/tests-unitaires/)
  - [What Is Unit Testing? (GB)](https://builtin.com/software-engineering-perspectives/unit-testing)

- **Fuzzing :**

  - [Fuzzing sur Wikipedia (FR)](https://fr.wikipedia.org/wiki/Fuzzing)
  - [Fuzz Testing Expliqué (GB)](https://testfully.io/blog/fuzz-testing/)

- **Tests d'Intégration :**

  - [Introduction aux tests d'intégration (FR)](https://yogosha.com/fr/blog/test-integration/)
  - [Qu'est-ce que le test d'intégration ? (GB)](https://www.codecademy.com/resources/blog/what-is-integration-testing/)

- **Tests de mutation :**

  - [Mutation Testing : un pas de plus vers la perfection (FR)](https://blog.octo.com/mutation-testing-un-pas-de-plus-vers-la-perfection)
  - [Mutation Testing: Its Concepts With Best Practices (GB)](https://www.lambdatest.com/learning-hub/mutation-testing)

- **Programmation par contrat et invariant :**

  - [La programmation par contrat (FR)](https://fr.wikipedia.org/wiki/Programmation_par_contrat)
  - [Design by contract (GB)](https://en.m.wikipedia.org/wiki/Design_by_contract)
  - [Invariant de boucle (FR)](https://fr.wikipedia.org/wiki/Invariant_de_boucle)

- **Statefull fuzzing et Foundry :**

  - [Invariant Testing: Enter the Matrix (GB)](https://medium.com/cyfrin/invariant-testing-enter-the-matrix-c71363dea37e)
  - [Fuzzing et test d'invariants avec Foundry (GB)](https://www.cyfrin.io/blog/smart-contract-fuzzing-and-invariants-testing-foundry)
  - [Invariant Testing en Solidity (GB)](https://www.rareskills.io/post/invariant-testing-solidity)

- **Analyse Statique et Slither :**

  - [Analyse statique de programmes sur Wikipedia (FR)](https://fr.wikipedia.org/wiki/Analyse_statique_de_programmes)
  - [Slither (GB)](https://github.com/crytic/slither)
  - [Qu'est-ce que l'analyse statique ? (GB)](https://www.perforce.com/blog/sca/what-static-analysis)

- **Vérification Formelle :**
  - [Vérification formelle (FR)](https://fr.wikipedia.org/wiki/V%C3%A9rification_formelle)
  - [Vérification formelle des smart contracts (GB)](https://ethereum.org/en/developers/docs/smart-contracts/formal-verification/)
  - [Symbolic Testing with Halmos (GB)](https://a16zcrypto.com/posts/article/symbolic-testing-with-halmos-leveraging-existing-tests-for-formal-verification/)

### Outils et Technologies

- [vidéo de présentation de Gambit et Vertigo-rs](https://www.youtube.com/watch?v=HIN8lmj597M)
- [Gambit](https://github.com/Certora/gambit)
- [Vertigo-rs](https://github.com/RareSkills/vertigo-rs)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [rust](https://www.rust-lang.org/tools/install)
- [solc](https://docs.soliditylang.org/en/latest/installing-solidity.html)
- [solc-select](https://github.com/crytic/solc-select)
