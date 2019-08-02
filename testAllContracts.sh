#!/bin/bash

echo "Running tests on all three questions..."
echo "***Testing Question 2.1***"
cd Question\ 2.1/
truffle test
echo "***Testing Question 2.2***"
cd ../Question\ 2.2/
truffle test
echo "***Testing Question 2.3***"
cd ../Question\ 2.3/
truffle test
