
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Listing, ListingVariant } from '../../types';
import { PlusIcon, InformationCircleIcon, XCircleIcon, CheckCircleIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PlayCircleIcon } from '../icons/Icons';

interface CreateListingModalProps {
  userLocation: { country: string; city:string; };
  onSave: (listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'> & { id?: string; proofOfPurchaseCid?: string }, imageFiles: File[], proofFile?: File, videoFile?: File) => void;
  listingToEdit?: Listing | null;
}

const categories = [
    'Недвижимость',
    'Автомобили',
    'Электроника',
    'Телефоны и аксессуары',
    'Компьютеры и ноутбуки',
    'Бытовая техника',
    'Фото- и видеотехника',
    'Игровые приставки и игры',
    'Цифровые товары',
    'Мебель и интерьер',
    'Ремонт и строительство',
    'Услуги',
    'Работа и вакансии',
    'Обучение и курсы',
    'Другое',
];

// Профессиональная конфигурация атрибутов для каждой категории
const categoryAttributesConfig: Record<string, Record<string, 'text' | 'number' | string[]>> = {
    'Недвижимость': {
        'Тип сделки': ['Аренда (длительно)', 'Аренда (посуточно)', 'Продажа'],
        'Тип объекта': ['Квартира', 'Дом/Коттедж', 'Комната', 'Коммерческая', 'Земельный участок', 'Гараж/Машиноместо'],
        'Площадь общая (м²)': 'number',
        'Жилая площадь (м²)': 'number',
        'Площадь кухни (м²)': 'number',
        'Количество комнат': ['Студия', '1', '2', '3', '4+'],
        'Этаж': 'number',
        'Этажность дома': 'number',
        'Материал стен': ['Кирпич', 'Панель', 'Монолит', 'Блок', 'Дерево'],
        'Санузел': ['Совмещенный', 'Раздельный', 'Несколько'],
        'Ремонт': ['Евро', 'Косметический', 'Дизайнерский', 'Без ремонта', 'Черновая отделка'],
    },
    'Автомобили': {
        'Тип кузова': ['Седан', 'Хетчбэк', 'Внедорожник/Кроссовер', 'Универсал', 'Купе', 'Кабриолет', 'Минивэн', 'Пикап', 'Лифтбек'],
        'Год выпуска': 'number',
        'Пробег (км)': 'number',
        'Коробка передач': ['Автомат', 'Механика', 'Робот', 'Вариатор'],
        'Тип двигателя': ['Бензин', 'Дизель', 'Гибрид', 'Электро', 'ГБО'],
        'Объем двигателя (л)': 'number',
        'Мощность (л.с.)': 'number',
        'Привод': ['Передний', 'Задний', 'Полный'],
        'Руль': ['Левый', 'Правый'],
        'Состояние': ['Не битый', 'Битый', 'Требует ремонта'],
        'Цвет': 'text',
        'ПТС': ['Оригинал', 'Дубликат', 'Электронный'],
    },
    'Телефоны и аксессуары': {
        'Операционная система': ['iOS', 'Android', 'HarmonyOS', 'Другая'],
        'Диагональ экрана (дюйм)': 'number',
        'Количество SIM-карт': ['1', '2', 'eSIM', '2 + eSIM'],
        'Состояние аккумулятора (%)': 'number',
    },
    'Компьютеры и ноутбуки': {
        'Тип': ['Ноутбук', 'Настольный ПК', 'Моноблок', 'Сервер', 'Комплектующие'],
        'Процессор (CPU)': 'text',
        'Видеокарта (GPU)': 'text',
        'Диагональ экрана (для ноутбуков)': 'number',
        'Операционная система': ['Windows', 'macOS', 'Linux', 'Без OS'],
    },
    'Электроника': {
        'Тип устройства': 'text',
        'Беспроводные интерфейсы': 'text',
        'Питание': ['Аккумулятор', 'Сеть', 'Батарейки'],
    },
    'Бытовая техника': {
        'Вид техники': ['Стиральная машина', 'Холодильник', 'Плита', 'Посудомоечная машина', 'Пылесос', 'Микроволновка', 'Кофемашина', 'Другое'],
        'Тип установки': ['Отдельностоящая', 'Встраиваемая'],
        'Класс энергопотребления': ['A+++', 'A++', 'A+', 'A', 'B'],
        'Ширина (см)': 'number',
        'Высота (см)': 'number',
        'Глубина (см)': 'number',
    },
    'Фото- и видеотехника': {
        'Тип камеры': ['Зеркальная', 'Беззеркальная', 'Компактная', 'Экшн-камера', 'Видеокамера', 'Дрон', 'Объектив'],
        'Разрешение матрицы (Мп)': 'number',
        'Тип матрицы': ['Full Frame', 'APS-C', 'Micro 4/3', '1 дюйм', 'Другая'],
        'Поддержка видео': ['4K', '8K', 'Full HD', 'HD'],
        'Байонет (крепление)': 'text',
    },
    'Игровые приставки и игры': {
        'Платформа': ['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'Steam Deck', 'PC', 'Retro'],
        'Тип товара': ['Игровая консоль', 'Игра', 'Геймпад', 'Аксессуар', 'Подписка/Валюта'],
        'Тип носителя (для игр)': ['Диск/Картридж', 'Цифровой ключ', 'Аккаунт'],
    },
    'Цифровые товары': {
        'Тип товара': ['Ключ активации', 'Аккаунт', 'Программное обеспечение', 'Подписка', 'Электронная книга', 'Файл проекта', 'Арт/Дизайн'],
        'Сервис/Платформа': 'text',
        'Регион активации': ['Весь мир (Global)', 'СНГ (CIS)', 'Россия', 'Европа', 'США', 'Азия'],
        'Срок действия': ['Навсегда', '1 год', '6 месяцев', '1 месяц'],
    },
    'Мебель и интерьер': {
        'Категория': ['Диваны и кресла', 'Кровати и матрасы', 'Шкафы и комоды', 'Столы и стулья', 'Кухонные гарнитуры', 'Текстиль', 'Освещение', 'Декор'],
        'Материал': 'text',
        'Ширина (см)': 'number',
        'Высота (см)': 'number',
        'Глубина (см)': 'number',
    },
    'Ремонт и строительство': {
        'Категория': ['Стройматериалы', 'Инструменты', 'Сантехника', 'Электрика', 'Двери', 'Окна', 'Потолки', 'Садовая техника'],
        'Тип': 'text',
        'Состояние': ['Новое', 'Б/у', 'Остатки'],
    },
    'Работа и вакансии': {
        'Сфера деятельности': ['IT и телеком', 'Продажи', 'Транспорт и логистика', 'Строительство', 'Производство', 'Туризм и рестораны', 'Административный персонал', 'Без опыта/Студенты'],
        'График работы': ['Полный день', 'Сменный график', 'Гибкий график', 'Удаленная работа', 'Вахта'],
        'Опыт работы': ['Не имеет значения', 'От 1 года', 'От 3 лет', 'Более 6 лет'],
        'Тип занятости': ['Полная', 'Частичная', 'Стажировка', 'Проектная'],
        'Частота выплат': ['Дважды в месяц', 'Еженедельно', 'Ежедневно', 'По факту выполнения'],
    },
    'Обучение и курсы': {
        'Формат обучения': ['Онлайн', 'Офлайн', 'Видеозапись'],
        'Направление': ['Программирование', 'Дизайн', 'Маркетинг', 'Иностранные языки', 'Бизнес', 'Психология', 'ЕГЭ/ОГЭ'],
        'Длительность': 'text',
        'Сертификат по окончании': ['Да', 'Нет'],
    },
    'Услуги': {
        'Категория услуг': ['Ремонт и отделка', 'IT и фриланс', 'Красота и здоровье', 'Перевозки', 'Уборка', 'Ремонт техники', 'Юридические услуги', 'Бухгалтерия'],
        'Опыт работы (лет)': 'number',
    },
    'Другое': {}
};

type CustomAttribute = { key: string; value: string };

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ userLocation, onSave, listingToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'New' | 'Used'>('Used');
  
  // Visual state (URLs for preview)
  const [images, setImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // File mapping state to track actual files for upload
  const fileMapRef = useRef<Map<string, File>>(new Map());
  
  const [location, setLocation] = useState(`${userLocation.city}, ${userLocation.country}`);
  const [quantity, setQuantity] = useState('1');

  // New fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [proofOfPurchase, setProofOfPurchase] = useState<File | null>(null);
  const [existingProofCid, setExistingProofCid] = useState<string | null>(null);
  
  const [attributes, setAttributes] = useState<Record<string, string | number>>({});
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [serviceDetails, setServiceDetails] = useState({
    duration: '1',
    unit: 'hour' as 'hour' | 'day' | 'project',
    locationType: 'remote' as 'remote' | 'on_site',
  });
  
  // Multi-variant state
  const [isMultiVariant, setIsMultiVariant] = useState(false);
  const [variantKeys, setVariantKeys] = useState<string[]>([]); // e.g. ['Color', 'Size']
  const [variants, setVariants] = useState<ListingVariant[]>([]);
  
  const isEditMode = !!listingToEdit;
  const [isCategorySelected, setIsCategorySelected] = useState(isEditMode);

  // Helpers to dynamic labels
  const getBrandLabel = () => {
      switch(category) {
          case 'Автомобили': return 'Марка (BMW, Toyota...)';
          case 'Недвижимость': return 'Название ЖК (необязательно)';
          case 'Работа и вакансии': return 'Название компании';
          case 'Обучение и курсы': return 'Школа / Автор';
          case 'Книги': return 'Автор';
          default: return 'Бренд / Производитель';
      }
  };

  const getModelLabel = () => {
      switch(category) {
          case 'Автомобили': return 'Модель (X5, Camry...)';
          case 'Недвижимость': return 'Номер квартиры (скрыт)';
          case 'Работа и вакансии': return 'Должность (повтор)';
          default: return 'Модель / Серия';
      }
  };

  const shouldShowBrandModel = () => {
      // Hide Brand/Model inputs for categories where they make no sense or are redundant
      return !['Услуги', 'Другое'].includes(category);
  };

  useEffect(() => {
    if (isEditMode && listingToEdit) {
      setTitle(listingToEdit.title);
      setDescription(listingToEdit.description);
      setPrice(String(listingToEdit.price));
      setCurrency(listingToEdit.currency);
      setCategory(listingToEdit.category);
      setCondition(listingToEdit.condition);
      setImages(listingToEdit.images);
      setLocation(listingToEdit.location);
      setQuantity(String(listingToEdit.quantity));
      setBrand(listingToEdit.brand || '');
      setModel(listingToEdit.model || '');
      setIsNegotiable(listingToEdit.isNegotiable || false);
      setVideoUrl(listingToEdit.videoUrl || '');
      if (listingToEdit.videoUrl) {
          setVideoPreview(listingToEdit.videoUrl);
      }
      
      // Store existing proof CID if present
      if (listingToEdit.proofOfPurchaseCid) {
          setExistingProofCid(listingToEdit.proofOfPurchaseCid);
      }
      
      const categoryConfigKeys = listingToEdit.category && categoryAttributesConfig[listingToEdit.category]
          ? Object.keys(categoryAttributesConfig[listingToEdit.category])
          : [];
      
      const categoryAttrs: Record<string, string | number> = {};
      const customAttrs: CustomAttribute[] = [];

      if (listingToEdit.attributes) {
          Object.entries(listingToEdit.attributes).forEach(([key, value]) => {
              if (categoryConfigKeys.includes(key)) {
                  categoryAttrs[key] = value as string | number;
              } else {
                  customAttrs.push({ key, value: String(value) });
              }
          });
      }
      setAttributes(categoryAttrs);
      setCustomAttributes(customAttrs);

      if (listingToEdit.serviceDetails) {
        setServiceDetails({
            duration: String(listingToEdit.serviceDetails.duration),
            unit: listingToEdit.serviceDetails.unit,
            locationType: listingToEdit.serviceDetails.locationType
        });
      }

      // Load variants if present
      if (listingToEdit.variants && listingToEdit.variants.length > 0) {
          setIsMultiVariant(true);
          setVariants(listingToEdit.variants);
          // Infer keys from the first variant attributes
          if (listingToEdit.variants[0].attributes) {
              setVariantKeys(Object.keys(listingToEdit.variants[0].attributes));
          }
      }
    }
  }, [listingToEdit, isEditMode]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
      return () => {
          fileMapRef.current.forEach((_, url) => URL.revokeObjectURL(url));
          if (videoPreview && !videoPreview.startsWith('http')) {
               URL.revokeObjectURL(videoPreview);
          }
      };
  }, []);

  const isFormValid = isCategorySelected && 
                      title.trim() !== '' && 
                      description.trim() !== '' && 
                      (isMultiVariant ? variants.length > 0 : (price.trim() !== '' && parseFloat(price) >= 0)) && 
                      category !== '' && 
                      images.length > 0 && 
                      location.trim() !== '' && 
                      (category === 'Недвижимость' || isMultiVariant || (quantity.trim() !== '' && parseInt(quantity, 10) > 0));

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImageUrls: string[] = [];
      
      files.forEach((file: File) => {
          if (file.type.startsWith('video/')) {
              const url = URL.createObjectURL(file);
              setVideoPreview(url);
              setVideoFile(file);
              // Clear any manually entered video URL if a file is selected
              setVideoUrl('');
          } else if (file.type.startsWith('image/')) {
              if (images.length < 9) { // Basic check, stricter check below
                  const url = URL.createObjectURL(file);
                  fileMapRef.current.set(url, file);
                  newImageUrls.push(url);
              }
          }
      });
      
      if (newImageUrls.length > 0) {
          setImages(prev => [...prev, ...newImageUrls].slice(0, 9));
      }
      
      // Reset input so same file can be selected again if needed (mostly for dev)
      event.target.value = ''; 
    }
  };
  
  const handleProofOfPurchaseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files.length > 0) {
        setProofOfPurchase(event.target.files[0]);
        // Clear existing CID visual indicator if new file uploaded
        setExistingProofCid(null);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
        const imgToRemove = prev[indexToRemove];
        // If we have a file for this URL, clean it up
        if (fileMapRef.current.has(imgToRemove)) {
            URL.revokeObjectURL(imgToRemove);
            fileMapRef.current.delete(imgToRemove);
        }
        return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const removeVideo = () => {
      if (videoPreview && !videoPreview.startsWith('http')) {
          URL.revokeObjectURL(videoPreview);
      }
      setVideoPreview(null);
      setVideoFile(null);
      setVideoUrl('');
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent negative inputs via typing
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
        setPrice(value);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent negative inputs and non-integers
    if (value === '' || /^[1-9]\d*$/.test(value)) {
        setQuantity(value);
    }
  };

  const handleAttributeChange = (key: string, value: string | number) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCategory = e.target.value;
      setCategory(newCategory);
      if(newCategory) {
          setIsCategorySelected(true);
      } else {
          setIsCategorySelected(false);
      }
      setAttributes({}); // Reset attributes on category change
      setCustomAttributes([]); // Also reset custom attributes
      setIsMultiVariant(false); // Reset multi-variant on category change
      setVariants([]);
      setVariantKeys([]);
  };

  const addCustomAttribute = () => {
      if (customAttributes.length < 5) {
          setCustomAttributes(prev => [...prev, { key: '', value: '' }]);
      }
  };

  const handleCustomAttributeChange = (index: number, field: 'key' | 'value', fieldValue: string) => {
      const newAttributes = [...customAttributes];
      newAttributes[index][field] = fieldValue;
      setCustomAttributes(newAttributes);
  };

  const removeCustomAttribute = (index: number) => {
      setCustomAttributes(prev => prev.filter((_, i) => i !== index));
  };

  // --- Multi-Variant Logic ---

  const addVariantKey = () => {
      if (variantKeys.length < 9) {
          setVariantKeys([...variantKeys, '']);
      }
  };

  const updateVariantKey = (index: number, value: string) => {
      const newKeys = [...variantKeys];
      newKeys[index] = value;
      setVariantKeys(newKeys);
      
      // Update existing variants' keys attributes safely
      const oldKey = variantKeys[index];
      if (oldKey && value) {
          setVariants(prev => prev.map(v => {
              const newAttrs = { ...v.attributes };
              newAttrs[value] = newAttrs[oldKey] || '';
              delete newAttrs[oldKey];
              return { ...v, attributes: newAttrs };
          }));
      }
  };

  const removeVariantKey = (index: number) => {
      const keyToRemove = variantKeys[index];
      setVariantKeys(variantKeys.filter((_, i) => i !== index));
      
      // Remove this attribute from all existing variants
      setVariants(prev => prev.map(v => {
          const newAttrs = { ...v.attributes };
          delete newAttrs[keyToRemove];
          return { ...v, attributes: newAttrs };
      }));
  };

  const addVariant = () => {
      const newVariant: ListingVariant = {
          id: `var-${Date.now()}`,
          attributes: {},
          price: parseFloat(price) || 0,
          quantity: 1
      };
      // Initialize attributes with empty strings
      variantKeys.forEach(k => {
          if (k) newVariant.attributes[k] = '';
      });
      setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof ListingVariant | 'attr', value: any, attrKey?: string) => {
      const newVariants = [...variants];
      if (field === 'attr' && attrKey) {
          newVariants[index].attributes = {
              ...newVariants[index].attributes,
              [attrKey]: value
          };
      } else if (field !== 'attr') {
          (newVariants[index] as any)[field] = value;
      }
      setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
      setVariants(variants.filter((_, i) => i !== index));
  };

  // --- Submit ---

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    const combinedAttributes = { ...attributes };
    customAttributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
            combinedAttributes[attr.key.trim()] = attr.value.trim();
        }
    });
    
    // Separate existing remote URLs from new Files to upload
    const filesToUpload: File[] = [];
    const keptRemoteUrls: string[] = [];

    images.forEach(url => {
        if (fileMapRef.current.has(url)) {
            filesToUpload.push(fileMapRef.current.get(url)!);
        } else {
            keptRemoteUrls.push(url);
        }
    });
    
    // Calculate totals for multi-variant
    let finalPrice = parseFloat(price);
    let finalQuantity = parseInt(quantity, 10);
    
    if (isMultiVariant && variants.length > 0) {
        // Base price becomes the minimum variant price
        finalPrice = Math.min(...variants.map(v => v.price));
        // Total quantity is sum of variants
        finalQuantity = variants.reduce((acc, v) => acc + v.quantity, 0);
    }

    const listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'> & { proofOfPurchaseCid?: string } = {
      title,
      description,
      price: finalPrice,
      currency,
      images: keptRemoteUrls, // Pass only existing URLs, service handles appending new uploads
      category,
      condition: category === 'Недвижимость' ? 'Used' : condition,
      createdAt: listingToEdit?.createdAt ?? new Date().toISOString(),
      location: location,
      quantity: category === 'Недвижимость' ? 1 : finalQuantity,
      brand: brand || undefined,
      model: model || undefined,
      isNegotiable,
      videoUrl: videoUrl || undefined,
      // Pass existing CID if valid and no new file
      proofOfPurchaseCid: existingProofCid || undefined,
      attributes: Object.keys(combinedAttributes).length > 0 ? combinedAttributes : undefined,
      serviceDetails: category === 'Услуги' ? {
        duration: parseInt(serviceDetails.duration),
        unit: serviceDetails.unit,
        locationType: serviceDetails.locationType,
      } : undefined,
      variants: isMultiVariant && variants.length > 0 ? variants : undefined,
    };
    
    // Pass the video file if one was selected. If user pasted a URL manually (videoUrl), it's in listingData.
    const videoToUpload = videoFile || undefined;
    
    if (isEditMode) {
        onSave({ ...listingData, id: listingToEdit.id }, filesToUpload, proofOfPurchase || undefined, videoToUpload);
    } else {
        onSave(listingData, filesToUpload, proofOfPurchase || undefined, videoToUpload);
    }
  };

  const renderCategoryAttributes = useCallback(() => {
    if (!category || !categoryAttributesConfig[category]) return null;
    
    return (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg">
             <h3 className="text-sm font-semibold text-gray-200">Характеристики</h3>
             {Object.entries(categoryAttributesConfig[category]).map(([key, type]) => (
                <div key={key}>
                    <label className="text-xs font-medium text-gray-400">{key}</label>
                    {Array.isArray(type) ? (
                         <select value={attributes[key] as string || ''} onChange={e => handleAttributeChange(key, e.target.value)} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors">
                            <option className="bg-gray-900" value="">Не выбрано</option>
                            {type.map(option => <option key={option} className="bg-gray-900" value={option}>{option}</option>)}
                        </select>
                    ) : (
                         <input type={type} value={attributes[key] || ''} onChange={e => handleAttributeChange(key, e.target.value)} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                    )}
                </div>
            ))}
        </div>
    );
  }, [category, attributes]);
  
  const renderCustomAttributes = useCallback(() => (
      <div className="space-y-3 p-3 bg-white/5 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-200">Дополнительно (до 5 полей)</h3>
          <div className="space-y-2">
            {customAttributes.map((attr, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        placeholder="Название" 
                        value={attr.key} 
                        onChange={(e) => handleCustomAttributeChange(index, 'key', e.target.value)}
                        className="flex-1 min-w-0 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <input 
                        type="text" 
                        placeholder="Значение" 
                        value={attr.value} 
                        onChange={(e) => handleCustomAttributeChange(index, 'value', e.target.value)}
                        className="flex-1 min-w-0 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button onClick={() => removeCustomAttribute(index)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
          </div>
          {customAttributes.length < 5 && (
            <button 
                onClick={addCustomAttribute}
                className="w-full text-sm font-medium text-cyan-400 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <PlusIcon className="w-5 h-5"/>
                Добавить поле
            </button>
          )}
      </div>
  ), [customAttributes]);

  const renderVariantEditor = () => (
      <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-cyan-400">Настройка вариантов</h3>
              <button onClick={addVariantKey} disabled={variantKeys.length >= 9} className="text-xs text-gray-400 hover:text-white disabled:opacity-50">
                  + Параметр (Цвет, Размер)
              </button>
          </div>

          {/* Define Keys */}
          <div className="flex flex-wrap gap-2 mb-4">
              {variantKeys.map((key, index) => (
                  <div key={index} className="relative">
                      <input 
                          type="text" 
                          value={key} 
                          onChange={(e) => updateVariantKey(index, e.target.value)} 
                          placeholder={`Параметр ${index+1}`}
                          className="bg-slate-800 border border-white/10 rounded-md px-2 py-1 text-xs text-white w-24 focus:border-cyan-500 outline-none"
                      />
                      <button onClick={() => removeVariantKey(index)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">&times;</button>
                  </div>
              ))}
              {variantKeys.length === 0 && <p className="text-xs text-gray-500 italic">Добавьте параметр (например, "Цвет"), чтобы начать.</p>}
          </div>

          {/* Add Variant Button */}
          {variantKeys.length > 0 && (
              <button 
                  onClick={addVariant} 
                  className="w-full py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/20 transition-colors mb-3"
              >
                  + Добавить вариант
              </button>
          )}

          {/* List of Variants */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {variants.map((variant, index) => (
                  <div key={variant.id} className="bg-slate-800/50 p-2 rounded-lg border border-white/5 text-xs">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          {variantKeys.map(key => (
                              <div key={key}>
                                  <span className="text-gray-500 block text-[10px] mb-0.5">{key}</span>
                                  <input 
                                      type="text" 
                                      value={variant.attributes[key] || ''} 
                                      onChange={(e) => updateVariant(index, 'attr', e.target.value, key)}
                                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                                  />
                              </div>
                          ))}
                      </div>
                      <div className="flex gap-2 items-end">
                          <div className="flex-1">
                              <span className="text-gray-500 block text-[10px] mb-0.5">Цена ({currency})</span>
                              <input 
                                  type="number" 
                                  value={variant.price} 
                                  onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                              />
                          </div>
                          <div className="flex-1">
                              <span className="text-gray-500 block text-[10px] mb-0.5">Количество</span>
                              <input 
                                  type="number" 
                                  value={variant.quantity} 
                                  onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value, 10))}
                                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                              />
                          </div>
                          <button onClick={() => removeVariant(index)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 h-8 w-8 flex items-center justify-center">
                              <TrashIcon className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

   const renderServiceDetails = () => (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-200">Детали услуги</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium text-gray-400">Срок выполнения</label>
                    <input type="number" min="1" value={serviceDetails.duration} onChange={e => setServiceDetails(p => ({...p, duration: e.target.value}))} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                     <label className="text-xs font-medium text-gray-400">Единица измерения</label>
                     <select value={serviceDetails.unit} onChange={e => setServiceDetails(p => ({...p, unit: e.target.value as any}))} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                        <option className="bg-gray-900" value="hour">Час</option>
                        <option className="bg-gray-900" value="day">День</option>
                        <option className="bg-gray-900" value="project">Проект целиком</option>
                    </select>
                </div>
            </div>
            <div>
                 <label className="text-xs font-medium text-gray-400">Формат работы</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setServiceDetails(p => ({...p, locationType: 'remote'}))} className={`py-2 rounded-full text-sm font-semibold transition backdrop-blur-sm ${serviceDetails.locationType === 'remote' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}>Удаленно</button>
                    <button onClick={() => setServiceDetails(p => ({...p, locationType: 'on_site'}))} className={`py-2 rounded-full text-sm font-semibold transition backdrop-blur-sm ${serviceDetails.locationType === 'on_site' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}>На месте</button>
                </div>
            </div>
        </div>
   );

  return (
    <>
        <div className="px-4 pt-0 pb-4 space-y-3">
            <h2 className="text-lg font-bold text-white text-center">{isEditMode ? 'Редактировать объявление' : 'Новое объявление'}</h2>

            <div>
                <label htmlFor="category" className="text-sm font-medium text-gray-300">Категория<span className="text-red-400">*</span></label>
                <select id="category" value={category} onChange={handleCategoryChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                    <option className="bg-gray-900" value="">Сначала выберите категорию</option>
                    {categories.map(cat => <option className="bg-gray-900" key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            <div className={`grid transition-all duration-500 ease-in-out ${isCategorySelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="space-y-3 pt-3">
                        <div>
                            <label className="text-sm font-medium text-gray-300">Фото (до 9) и видео (1)<span className="text-red-400">*</span></label>
                             <div className="mt-2 grid grid-cols-4 gap-3">
                                
                                {/* VIDEO PREVIEW SLOT (FIRST POSITION IF EXISTS) */}
                                {videoPreview && (
                                    <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-white/10 group">
                                        <video src={videoPreview} className="w-full h-full object-cover opacity-80" muted />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PlayCircleIcon className="w-8 h-8 text-white/80 drop-shadow-lg" />
                                        </div>
                                        <button onClick={removeVideo} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10">&times;</button>
                                    </div>
                                )}

                                {/* IMAGE SLOTS */}
                                {images.map((img, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img src={img} alt="upload preview" className="w-full h-full object-cover rounded-xl border border-white/5" />
                                        <button onClick={() => removeImage(index)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                                    </div>
                                ))}
                                
                                {/* UPLOAD BUTTON (Accepts both) */}
                                {(images.length < 9 || !videoPreview) && (
                                     <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-cyan-500 transition-colors bg-white/5 hover:bg-white/10 group">
                                        <div className="p-2 bg-white/5 rounded-full mb-1 group-hover:bg-cyan-500/20 transition-colors">
                                            <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-cyan-400"/>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 text-center leading-tight">
                                            Фото<br/>Видео
                                        </span>
                                        <input 
                                            type="file" 
                                            accept="image/*, video/mp4, video/x-m4v, video/*" 
                                            multiple 
                                            onChange={handleMediaUpload} 
                                            className="hidden" 
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                         
                         {/* Optional Video Link Input (Hidden if file uploaded to avoid confusion) */}
                         {!videoPreview && (
                            <div>
                                <label htmlFor="videoUrl" className="text-sm font-medium text-gray-300">Видеообзор (ссылка YouTube/Vimeo)</label>
                                <input id="videoUrl" type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://...mp4" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                         )}

                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-gray-300">Название<span className="text-red-400">*</span></label>
                            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="text-sm font-medium text-gray-300">Описание<span className="text-red-400">*</span></label>
                            <textarea id="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        {shouldShowBrandModel() && (
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label htmlFor="brand" className="text-sm font-medium text-gray-300">{getBrandLabel()}</label>
                                    <input id="brand" type="text" value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                                 <div>
                                    <label htmlFor="model" className="text-sm font-medium text-gray-300">{getModelLabel()}</label>
                                    <input id="model" type="text" value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                            </div>
                        )}
                        
                        {category === 'Услуги' ? renderServiceDetails() : renderCategoryAttributes()}

                        {category && renderCustomAttributes()}

                        {/* Currency Selection */}
                        <div>
                            <label htmlFor="currency" className="text-sm font-medium text-gray-300">Валюта</label>
                            <select id="currency" value={currency} onChange={e => setCurrency(e.target.value as 'USDC' | 'USDT')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                                <option className="bg-gray-900" value="USDC">USDC</option>
                                <option className="bg-gray-900" value="USDT">USDT</option>
                            </select>
                        </div>

                        {/* Multi-Variant Toggle */}
                        {category !== 'Недвижимость' && category !== 'Услуги' && (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-200">Несколько вариантов</span>
                                    <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div onClick={() => setIsMultiVariant(p => !p)} className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isMultiVariant} readOnly className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                </div>
                            </div>
                        )}

                        {isMultiVariant ? (
                            renderVariantEditor()
                        ) : (
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="text-sm font-medium text-gray-300">{category === 'Работа и вакансии' ? 'Зарплата' : 'Цена'}<span className="text-red-400">*</span></label>
                                    <input id="price" type="number" min="0" value={price} onChange={handlePriceChange} placeholder="0.00" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                                {category !== 'Недвижимость' && category !== 'Работа и вакансии' && category !== 'Услуги' && (
                                    <div>
                                        <label htmlFor="quantity" className="text-sm font-medium text-gray-300">Количество<span className="text-red-400">*</span></label>
                                        <input id="quantity" type="number" min="1" step="1" value={quantity} onChange={handleQuantityChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <label htmlFor="isNegotiable" className="text-sm font-medium text-gray-200">Торг уместен</label>
                            <div onClick={() => setIsNegotiable(p => !p)} className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isNegotiable} readOnly id="isNegotiable" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="location" className="text-sm font-medium text-gray-300">Город<span className="text-red-400">*</span></label>
                            <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        {category !== 'Недвижимость' && category !== 'Работа и вакансии' && category !== 'Услуги' && category !== 'Цифровые товары' && category !== 'Обучение и курсы' && (
                             <div className="grid grid-cols-1 gap-4">
                                 <div>
                                    <label className="text-sm font-medium text-gray-300">Состояние</label>
                                    <div className="mt-2 flex space-x-2">
                                         <button onClick={() => setCondition('New')} className={`px-4 py-2 rounded-full text-sm w-full transition-colors backdrop-blur-sm ${condition === 'New' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}>Новый</button>
                                         <button onClick={() => setCondition('Used')} className={`px-4 py-2 rounded-full text-sm w-full transition-colors backdrop-blur-sm ${condition === 'Used' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}>Б/у</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                         {category !== 'Услуги' && category !== 'Работа и вакансии' && category !== 'Обучение и курсы' && (
                             <div>
                                <label className="text-sm font-medium text-gray-300">Доказательство покупки (чек, гарантия)</label>
                                 <div className="mt-1 flex items-center justify-center w-full">
                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${existingProofCid ? 'border-green-500/50 bg-green-500/5' : 'border-gray-600 bg-white/5 hover:bg-white/10'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {proofOfPurchase ? (
                                                <p className="mb-2 text-sm text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> {proofOfPurchase.name}</p>
                                            ) : existingProofCid ? (
                                                <p className="mb-2 text-sm text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> Текущий файл прикреплен</p>
                                            ) : (
                                                <p className="mb-2 text-sm text-gray-400">Нажмите для загрузки</p>
                                            )}
                                            <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                                        </div>
                                        <input type="file" onChange={handleProofOfPurchaseUpload} className="hidden" />
                                    </label>
                                </div> 
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <footer className={`px-4 transition-opacity duration-300 ${isCategorySelected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="p-3 mb-3 bg-blue-500/10 text-blue-300 text-xs rounded-lg flex items-start gap-2 text-left">
              <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
              <div>
                  При успешной продаже через Escrow, с продавца будет удержана комиссия платформы в размере <strong>1%</strong> от суммы сделки.
              </div>
          </div>
          <button onClick={handleSubmit} disabled={!isFormValid} className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isEditMode ? 'Сохранить изменения' : 'Опубликовать'}
          </button>
        </footer>
    </>
  );
};
