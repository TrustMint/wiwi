// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @author DeMarket Protocol Team
 * @notice Тестовый токен USDC для локальной разработки и Testnet.
 * @dev ВАЖНО: Реализует 6 decimals, как настоящий USDC.
 */
contract MockUSDC is ERC20 {
    
    constructor() ERC20("USD Coin", "USDC") {}

    /**
     * @notice Функция "Кран" (Faucet).
     * @dev Позволяет любому пользователю получить тестовые токены.
     * В продакшене у USDC такой функции нет (минтит только Circle).
     */
    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    /**
     * @notice Переопределение decimals.
     * @dev USDC использует 6 знаков, а не стандартные 18.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}