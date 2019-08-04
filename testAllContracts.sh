#!/bin/bash

echo "Running tests on all three questions..."
echo "Starting ganache CLI local dev blockchain"
ganache-cli --gasLimit 60000000000 2> /dev/null 1> /dev/null &
sleep 3
echo "***Testing Question 2.1***"
cd Question\ 2.1/
truffle test
echo "***Testing Question 2.2***"
cd ../Question\ 2.2/
truffle test
echo "***Testing Question 2.3***"
cd ../Question\ 2.3/
truffle test
kill -9 $(lsof -t -i:8545)
echo "Closed Ganache CLI and finished running all tests"