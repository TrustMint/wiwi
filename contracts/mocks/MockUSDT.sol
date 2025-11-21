// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @author DeMarket Protocol Team
 * @notice Тестовый токен USDT для локальной разработки и Testnet.
 * @dev ВАЖНО: Реализует 6 decimals, как настоящий USDT в сети Ethereum/Arbitrum.
 */
contract MockUSDT is ERC20 {
    
    constructor() ERC20("Tether USD", "USDT") {}

    /**
     * @notice Функция "Кран" (Faucet).
     * @dev Позволяет любому пользователю напечатать себе токены для тестов.
     */
    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    /**
     * @notice Переопределение decimals.
     * @dev USDT, как и USDC, использует 6 знаков.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}