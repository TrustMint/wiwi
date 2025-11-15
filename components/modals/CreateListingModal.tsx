import React, { useState, useEffect, useCallback } from 'react';
import { Listing } from '../../types';
import { PlusIcon, InformationCircleIcon, XCircleIcon } from '../icons/Icons';

interface CreateListingModalProps {
  userLocation: { country: string; city:string; };
  onSave: (listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'> & { id?: string }) => void;
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
    'Одежда, обувь, аксессуары',
    'Товары для детей и игрушки',
    'Мебель и интерьер',
    'Ремонт и строительство',
    'Услуги',
    'Работа и вакансии',
    'Обучение и курсы',
    'Другое',
];

const categoryAttributesConfig: Record<string, Record<string, 'text' | 'number' | string[]>> = {
    'Телефоны и аксессуары': {
        'Цвет': 'text',
        'Память (GB)': 'number',
        'RAM (GB)': 'number',
    },
    'Автомобили': {
        'Год выпуска': 'number',
        'Пробег (км)': 'number',
        'Объем двигателя (л)': 'number',
        'Коробка передач': ['Автомат', 'Механика', 'Робот', 'Вариатор'],
    },
    'Компьютеры и ноутбуки': {
        'Процессор': 'text',
        'RAM (GB)': 'number',
        'Тип накопителя': ['SSD', 'HDD'],
        'Объем накопителя (GB)': 'number'
    },
    'Недвижимость': {
        'Тип сделки': ['Аренда', 'Продажа'],
        'Тип недвижимости': ['Квартира', 'Дом', 'Комната', 'Коммерческая'],
        'Площадь (м²)': 'number',
        'Количество комнат': 'number',
        'Этаж': 'number',
        'Этажей в доме': 'number',
    },
};

type CustomAttribute = { key: string; value: string };

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ userLocation, onSave, listingToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'New' | 'Used'>('Used');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState(`${userLocation.city}, ${userLocation.country}`);
  const [quantity, setQuantity] = useState('1');

  // New fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [proofOfPurchase, setProofOfPurchase] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<Record<string, string | number>>({});
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [serviceDetails, setServiceDetails] = useState({
    duration: '1',
    unit: 'hour' as 'hour' | 'day' | 'project',
    locationType: 'remote' as 'remote' | 'on_site',
  });
  
  const isEditMode = !!listingToEdit;
  const [isCategorySelected, setIsCategorySelected] = useState(isEditMode);

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
    }
  }, [listingToEdit, isEditMode]);


  const isFormValid = isCategorySelected && title.trim() !== '' && description.trim() !== '' && price.trim() !== '' && parseFloat(price) >= 0 && category !== '' && images.length > 0 && location.trim() !== '' && (category === 'Недвижимость' || (quantity.trim() !== '' && parseInt(quantity, 10) > 0));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImageUrls = files.map(file => URL.createObjectURL(file as Blob));
      setImages(prev => [...prev, ...newImageUrls].slice(0, 9));
    }
  };
  
  const handleProofOfPurchaseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files.length > 0) {
        setProofOfPurchase(event.target.files[0]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
        setPrice(value);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    const proofOfPurchaseCid = proofOfPurchase ? `ipfs-simulated-cid-for-${proofOfPurchase.name}` : listingToEdit?.proofOfPurchaseCid;

    const combinedAttributes = { ...attributes };
    customAttributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
            combinedAttributes[attr.key.trim()] = attr.value.trim();
        }
    });

    const listingData: Omit<Listing, 'id' | 'seller' | 'status' | 'buyer'> = {
      title,
      description,
      price: parseFloat(price),
      currency,
      images,
      category,
      condition: category === 'Недвижимость' ? 'Used' : condition,
      createdAt: listingToEdit?.createdAt ?? new Date().toISOString(),
      location: location,
      quantity: category === 'Недвижимость' ? 1 : parseInt(quantity, 10),
      brand: brand || undefined,
      model: model || undefined,
      isNegotiable,
      videoUrl: videoUrl || undefined,
      proofOfPurchaseCid: proofOfPurchaseCid,
      attributes: Object.keys(combinedAttributes).length > 0 ? combinedAttributes : undefined,
      serviceDetails: category === 'Услуги' ? {
        duration: parseInt(serviceDetails.duration),
        unit: serviceDetails.unit,
        locationType: serviceDetails.locationType,
      } : undefined,
    };
    
    if (isEditMode) {
        onSave({ ...listingData, id: listingToEdit.id });
    } else {
        onSave(listingData);
    }
  };

  const renderCategoryAttributes = useCallback(() => {
    if (!category || !categoryAttributesConfig[category]) return null;
    
    return (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg">
             <h3 className="text-sm font-semibold text-gray-200">Доп. характеристики</h3>
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
          <h3 className="text-sm font-semibold text-gray-200">Свои поля (до 5)</h3>
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
                Добавить поле ({5 - customAttributes.length} осталось)
            </button>
          )}
      </div>
  ), [customAttributes]);

   const renderServiceDetails = () => (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-200">Детали услуги</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium text-gray-400">Срок</label>
                    <input type="number" min="1" value={serviceDetails.duration} onChange={e => setServiceDetails(p => ({...p, duration: e.target.value}))} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                     <label className="text-xs font-medium text-gray-400">Единица</label>
                     <select value={serviceDetails.unit} onChange={e => setServiceDetails(p => ({...p, unit: e.target.value as any}))} className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                        <option className="bg-gray-900" value="hour">Час</option>
                        <option className="bg-gray-900" value="day">День</option>
                        <option className="bg-gray-900" value="project">Проект</option>
                    </select>
                </div>
            </div>
            <div>
                 <label className="text-xs font-medium text-gray-400">Формат</label>
                <div className="mt-2 grid grid-cols-2 gap-1 p-1 bg-black/20 rounded-lg">
                    <button onClick={() => setServiceDetails(p => ({...p, locationType: 'remote'}))} className={`py-1.5 rounded-md text-sm font-semibold transition ${serviceDetails.locationType === 'remote' ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}>Удаленно</button>
                    <button onClick={() => setServiceDetails(p => ({...p, locationType: 'on_site'}))} className={`py-1.5 rounded-md text-sm font-semibold transition ${serviceDetails.locationType === 'on_site' ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}>На месте</button>
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
                             <div className="mt-1 grid grid-cols-5 gap-2">
                                {images.map((img, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img src={img} alt="upload preview" className="w-full h-full object-cover rounded-lg" />
                                        <button onClick={() => removeImage(index)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                                    </div>
                                ))}
                                {images.length < 9 && (
                                     <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors">
                                        <PlusIcon className="w-8 h-8 text-gray-500"/>
                                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="videoUrl" className="text-sm font-medium text-gray-300">Видеообзор (ссылка)</label>
                            <input id="videoUrl" type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://...mp4" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>

                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-gray-300">Название<span className="text-red-400">*</span></label>
                            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="text-sm font-medium text-gray-300">Описание<span className="text-red-400">*</span></label>
                            <textarea id="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        {category !== 'Недвижимость' && category !== 'Услуги' && (
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label htmlFor="brand" className="text-sm font-medium text-gray-300">Бренд</label>
                                    <input id="brand" type="text" value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                                 <div>
                                    <label htmlFor="model" className="text-sm font-medium text-gray-300">Модель</label>
                                    <input id="model" type="text" value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                            </div>
                        )}
                        
                        {category === 'Услуги' ? renderServiceDetails() : renderCategoryAttributes()}

                        {category && renderCustomAttributes()}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price" className="text-sm font-medium text-gray-300">Цена<span className="text-red-400">*</span></label>
                                <input id="price" type="number" min="0" value={price} onChange={handlePriceChange} placeholder="0.00" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                             <div>
                                <label htmlFor="currency" className="text-sm font-medium text-gray-300">Валюта</label>
                                 <select id="currency" value={currency} onChange={e => setCurrency(e.target.value as 'USDC' | 'USDT')} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                                    <option className="bg-gray-900" value="USDC">USDC</option>
                                    <option className="bg-gray-900" value="USDT">USDT</option>
                                </select>
                            </div>
                        </div>
                        
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
                        
                        {category !== 'Недвижимость' && (
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-sm font-medium text-gray-300">Состояние</label>
                                    <div className="mt-2 flex space-x-2">
                                         <button onClick={() => setCondition('New')} className={`px-4 py-2 rounded-lg text-sm w-full transition-colors ${condition === 'New' ? 'bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>Новый</button>
                                         <button onClick={() => setCondition('Used')} className={`px-4 py-2 rounded-lg text-sm w-full transition-colors ${condition === 'Used' ? 'bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>Б/у</button>
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="quantity" className="text-sm font-medium text-gray-300">Количество<span className="text-red-400">*</span></label>
                                    <input id="quantity" type="number" min="1" step="1" value={quantity} onChange={handleQuantityChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                            </div>
                        )}
                        
                         <div>
                            <label className="text-sm font-medium text-gray-300">Доказательство покупки (чек, гарантия)</label>
                             <div className="mt-1 flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <p className="mb-2 text-sm text-gray-400">{proofOfPurchase ? proofOfPurchase.name : 'Нажмите для загрузки'}</p>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                                    </div>
                                    <input type="file" onChange={handleProofOfPurchaseUpload} className="hidden" />
                                </label>
                            </div> 
                        </div>
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