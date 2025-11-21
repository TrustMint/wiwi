// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Импорт библиотеки ошибок
import "../libraries/Errors.sol";

/**
 * @title DeMarketSoulbound
 * @author DeMarket Protocol Team
 * @notice Система репутации и достижений (Badges).
 * @dev Реализует Soulbound токены (SBT) на стандарте ERC1155.
 * Токены привязаны к адресу и не могут быть переданы.
 */
contract DeMarketSoulbound is ERC1155, AccessControl, ERC1155Supply {
    using Strings for uint256;

    // =============================================================
    //                           ROLES
    // =============================================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @dev Роль для контрактов (Marketplace/Staking), которые могут выдавать бейджи
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // =============================================================
    //                           STATE
    // =============================================================

    /// @notice Название коллекции (для OpenSea/Rarible)
    string public name = "DeMarket Reputation Badges";
    /// @notice Символ коллекции
    string public symbol = "DMSBT";

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    /**
     * @param _baseUri Базовый URI для метаданных (например, "ipfs://CID/")
     */
    constructor(string memory _baseUri) ERC1155(_baseUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // =============================================================
    //                     SOULBOUND LOGIC
    // =============================================================

    /**
     * @dev Хук, вызываемый перед любым изменением баланса (минт, берн, трансфер).
     * В OpenZeppelin v5 это заменяет _beforeTokenTransfer.
     * Здесь мы реализуем логику Soulbound: блокируем трансферы между пользователями.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Разрешаем Mint (from == 0)
        // Разрешаем Burn (to == 0)
        // Запрещаем Transfer (from != 0 AND to != 0)
        
        if (from != address(0) && to != address(0)) {
            revert Errors.SoulboundTransferFailed();
        }

        super._update(from, to, ids, values);
    }

    // =============================================================
    //                     MINTER ACTIONS
    // =============================================================

    /**
     * @notice Выдать бейдж пользователю.
     * @param _to Адрес получателя
     * @param _id ID бейджа (см. constants/Badges.ts на фронте)
     * @param _amount Количество (обычно 1)
     * @param _data Дополнительные данные
     */
    function mint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) external onlyRole(MINTER_ROLE) {
        _mint(_to, _id, _amount, _data);
    }

    /**
     * @notice Выдать несколько бейджей сразу (экономия газа).
     */
    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) external onlyRole(MINTER_ROLE) {
        _mintBatch(_to, _ids, _amounts, _data);
    }

    /**
     * @notice Отозвать бейдж (например, если пользователь нарушил правила DAO).
     * @dev Может вызывать только ADMIN или MINTER (логику можно настроить).
     */
    function revokeBadge(
        address _from,
        uint256 _id,
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) {
        _burn(_from, _id, _amount);
    }

    // =============================================================
    //                     METADATA
    // =============================================================

    /**
     * @notice Обновить базовый URI (если переехали на новый IPFS).
     */
    function setURI(string memory newuri) external onlyRole(ADMIN_ROLE) {
        _setURI(newuri);
    }

    /**
     * @notice Возвращает URI для конкретного токена.
     * @dev Клиенты обычно сами подставляют {id}, но для некоторых маркетплейсов
     * полезно возвращать полный путь.
     */
    function uri(uint256 _id) public view override returns (string memory) {
        string memory baseURI = super.uri(_id);
        return string(abi.encodePacked(baseURI, Strings.toString(_id), ".json"));
    }

    // =============================================================
    //                     OVERRIDES
    // =============================================================

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}