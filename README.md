#  Fintech And Crypto Currencies Exam 
Solutions to the take home exam for Fintech And Cryptocurrencies masters course at UCT.

All solutions to the exam are within this repo. The theory questions solutions can be found [here](./FCC_exam_theory_answers.pdf). Each question is within it's own directory and has its own truffle setup. All questions use the same set of node modules to provide the required libraries to run the tests (chai, openzepplen ect.). Additionally, the contracts make use of openzepplin for ERC20 and ERC721 implementations.

To set everything up you will need to install all the node modules specified in the `package.json`. This can be done by running the following in the root directory of the repo.
```
npm install
```

Then, you can navigate to each directory and run the truffle tests using:
```
truffle test
```

A testing script was also created to run all three questions tests one after the other. This script also starts up a local Ganache CLI instance. To run this execute the following in the root of the repo
```
./testAllContracts.sh
```