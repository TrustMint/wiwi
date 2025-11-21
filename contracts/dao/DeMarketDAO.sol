// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- OpenZeppelin Governance Modules ---
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title DeMarketDAO
 * @author DeMarket Protocol Team
 * @notice Контракт управления протоколом. Позволяет держателям DMT управлять параметрами маркетплейса и казной.
 * @dev Реализует стандарт OpenZeppelin Governor с Timelock контроллером.
 */
contract DeMarketDAO is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorTimelockControl 
{
    /**
     * @notice Конструктор DAO
     * @param _token Адрес токена DeMarketToken (DMT), который используется для голосования (IVotes).
     * @param _timelock Адрес контракта DeMarketTreasury (TimelockController).
     * 
     * @dev Параметры ниже настроены для L2 (Arbitrum), где блоки быстрые (~0.25 сек), 
     * но здесь мы используем timestamp или стандартные значения для совместимости.
     */
    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("DeMarketDAO")
        GovernorSettings(
            1 days, /* Voting Delay: Задержка перед началом голосования (защита от flash-loan атак) */
            1 weeks, /* Voting Period: Длительность голосования */
            100_000 ether /* Proposal Threshold: Мин. кол-во токенов (100k DMT) для создания предложения */
        )
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {}

    // =============================================================
    //                     CONFIGURATIONS
    // =============================================================

    /**
     * @notice Кворум — минимальный процент голосов "За", чтобы голосование считалось состоявшимся.
     * @dev 4% от общего саплая (стандарт Industry Standard).
     */
    function quorum(uint256 /* blockNumber */) public pure override returns (uint256) {
        return 4000000 ether; // Пример: 4% от 100M токенов = 4M голосов
    }

    /**
     * @notice Задержка голосования (защита от снапшотов в том же блоке).
     * @dev Переопределяем для разрешения конфликтов наследования.
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @notice Создание предложения.
     * @dev Переопределяем для разрешения конфликтов наследования.
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /**
     * @notice Порог голосов для создания пропозала.
     * @dev Переопределяем для разрешения конфликтов наследования.
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // =============================================================
    //                     INTERNAL OVERRIDES
    // =============================================================

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}