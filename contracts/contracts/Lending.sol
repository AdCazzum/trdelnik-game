// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILiquidStabilityPool {
    function offset(uint256 debtAmount) external;
    function getAvailableLiquidity() external view returns (uint256);
    function transferTo(address recipient, uint256 amount) external;
    function receiveFrom(address sender, uint256 amount) external;
}

contract LSPLiquidityManager {
    ILiquidStabilityPool public lsp;
    address public owner;
    uint256 public minLiquidityThreshold;
    uint256 public interestRate; // expressed in basis points (e.g., 500 = 5%)
    uint256 public maxLoanDuration; // in seconds

    struct Loan {
        uint256 amount;
        uint256 dueTime;
        uint256 interest;
    }

    mapping(address => Loan) public loans;
    mapping(address => bool) public approvedProtocols;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyApproved() {
        require(approvedProtocols[msg.sender], "Protocol not approved");
        _;
    }

    constructor(
        address _lsp,
        uint256 _minLiquidityThreshold,
        uint256 _interestRate,
        uint256 _maxLoanDuration
    ) {
        lsp = ILiquidStabilityPool(_lsp);
        owner = msg.sender;
        minLiquidityThreshold = _minLiquidityThreshold;
        interestRate = _interestRate;
        maxLoanDuration = _maxLoanDuration;
    }

    function approveProtocol(address protocol, bool status) external onlyOwner {
        approvedProtocols[protocol] = status;
    }

    function updateParameters(
        uint256 _minLiquidityThreshold,
        uint256 _interestRate,
        uint256 _maxLoanDuration
    ) external onlyOwner {
        minLiquidityThreshold = _minLiquidityThreshold;
        interestRate = _interestRate;
        maxLoanDuration = _maxLoanDuration;
    }

    function requestLoan(uint256 amount) external onlyApproved {
        uint256 availableLiquidity = lsp.getAvailableLiquidity();
        require(
            availableLiquidity > minLiquidityThreshold,
            "Insufficient liquidity"
        );
        uint256 maxLoanable = availableLiquidity - minLiquidityThreshold;
        require(
            amount <= maxLoanable,
            "Requested amount exceeds available liquidity"
        );

        uint256 interest = (amount * interestRate) / 10000;
        uint256 dueTime = block.timestamp + maxLoanDuration;

        loans[msg.sender] = Loan({
            amount: amount,
            dueTime: dueTime,
            interest: interest
        });

        lsp.transferTo(msg.sender, amount);
    }

    function repayLoan() external {
        Loan memory loan = loans[msg.sender];
        require(loan.amount > 0, "No active loan");

        uint256 totalRepayment = loan.amount + loan.interest;
        // Assume that the protocol has approved this contract to transfer NECT tokens on its behalf
        // The actual token transfer logic would depend on the NECT token implementation
        // For simplicity, we assume that the protocol transfers the NECT tokens to this contract before calling repayLoan

        lsp.receiveFrom(msg.sender, totalRepayment);
        delete loans[msg.sender];
    }

    function checkAndOffset(uint256 debtAmount) external onlyOwner {
        uint256 availableLiquidity = lsp.getAvailableLiquidity();
        require(
            availableLiquidity >= debtAmount,
            "Insufficient liquidity to offset debt"
        );
        lsp.offset(debtAmount);
    }
}
