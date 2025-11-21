// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- OpenZeppelin Standards ---
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title DeMarketToken (DMT)
 * @author DeMarket Protocol Team
 * @notice Утилитарный и управленческий токен экосистемы DeMarket.
 * @dev Реализует стандарты ERC20, Burnable (дефляция), Permit (gasless UX) и Votes (DAO).
 */
contract DeMarketToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit, ERC20Votes {
    
    // =============================================================
    //                           ROLES
    // =============================================================
    
    /// @notice Роль для минтинга новых токенов (например, для контракта Rewards/Staking)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    /**
     * @notice Инициализация токена
     * @param defaultAdmin Адрес, который получит права админа (обычно кошелек деплоера, затем передается в DAO Timelock).
     */
    constructor(address defaultAdmin)
        ERC20("DeMarket Token", "DMT")
        ERC20Permit("DeMarket Token")
    {
        // Настройка прав доступа
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);

        // --- INITIAL DISTRIBUTION (TGE) ---
        // Пример: 100,000,000 токенов (100M)
        // В продакшене здесь лучше минтить на адрес DeMarketTreasury
        _mint(defaultAdmin, 100_000_000 * 10 ** decimals());
    }

    // =============================================================
    //                     CORE FUNCTIONS
    // =============================================================

    /**
     * @notice Выпуск новых токенов.
     * @dev Доступно только адресам с ролью MINTER_ROLE (например, Staking контракт для выплаты наград).
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // =============================================================
    //                     OVERRIDES (BOILERPLATE)
    // =============================================================
    // Следующие функции необходимы для разрешения конфликтов наследования OpenZeppelin.
    // Solidity требует явного указания override, когда функция существует в нескольких родительских контрактах.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}