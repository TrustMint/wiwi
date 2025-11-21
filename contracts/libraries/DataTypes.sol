// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DataTypes
 * @author DeMarket Protocol Team
 * @notice Библиотека общих типов данных для экосистемы DeMarket.
 * @dev Используется для предотвращения циклических зависимостей и стандартизации структур.
 */
library DataTypes {

    // =============================================================
    //                           ENUMS
    // =============================================================

    /// @notice Статус объявления
    enum ListingStatus {
        Active,     // Товар доступен для покупки
        Sold,       // Товар распродан (количество = 0)
        Inactive    // Снят с продажи продавцом или админом
    }

    /// @notice Статус сделки (Escrow)
    enum EscrowStatus {
        Funded,     // Покупатель внес средства, ожидание отправки/получения
        Completed,  // Сделка успешно завершена, средства переведены продавцу
        Disputed,   // Открыт спор, средства заморожены
        Resolved,   // Спор решен арбитражем
        Cancelled   // Сделка отменена (средства возвращены покупателю)
    }

    /// @notice Статус спора
    enum DisputeStatus {
        Recruiting, // Набор присяжных (Арбитров)
        Voting,     // Идет голосование
        Resolved    // Решение принято
    }

    // =============================================================
    //                           STRUCTS
    // =============================================================

    /**
     * @notice Структура объявления о товаре/услуге.
     */
    struct Listing {
        uint256 id;             // Уникальный ID листинга
        address seller;         // Адрес продавца
        address token;          // Адрес токена оплаты (USDC/USDT)
        uint256 price;          // Цена за единицу (в wei)
        uint256 quantity;       // Доступное количество
        string ipfsCid;         // Ссылка на метаданные (JSON) в IPFS
        ListingStatus status;   // Текущий статус
        uint256 createdAt;      // Timestamp создания
    }

    /**
     * @notice Структура сделки (Escrow).
     * Хранит состояние конкретной покупки.
     */
    struct Escrow {
        uint256 id;             // Уникальный ID сделки
        uint256 listingId;      // Ссылка на объявление
        address buyer;          // Адрес покупателя
        address seller;         // Адрес продавца (дублируем для удобства)
        uint256 amount;         // Заблокированная сумма (цена * кол-во)
        address token;          // Токен оплаты
        EscrowStatus status;    // Текущий статус сделки
        uint256 createdAt;      // Timestamp создания
        uint256 disputeId;      // ID спора (если есть, иначе 0)
    }

    /**
     * @notice Структура спора.
     * Используется в ArbitrationRegistry.
     */
    struct Dispute {
        uint256 id;             // Уникальный ID спора
        uint256 escrowId;       // Ссылка на сделку
        address initiator;      // Кто открыл спор (Buyer/Seller)
        address buyer;          // Участник 1
        address seller;         // Участник 2
        uint256 amount;         // Оспариваемая сумма
        string reasonCid;       // Ссылка на описание проблемы/доказательства в IPFS
        DisputeStatus status;   // Статус процесса
        uint256 createdAt;      // Дата создания
        uint256 deadline;       // Дедлайн для набора судей или голосования
        
        // Данные голосования
        address[] jurors;       // Список выбранных арбитров
        uint256 votesForBuyer;  // Кол-во голосов за покупателя
        uint256 votesForSeller; // Кол-во голосов за продавца
        address winner;         // Победитель (адрес Buyer или Seller)
    }

    /**
     * @notice Структура профиля пользователя (для Staking/Reputation).
     * @dev Опционально, если нужно хранить агрегированные данные он-чейн.
     */
    struct UserProfile {
        uint256 totalSales;
        uint256 totalVolume;
        uint256 reputationScore; // 0-100
        uint256 reviewCount;
    }
}