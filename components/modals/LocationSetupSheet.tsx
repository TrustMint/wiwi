
import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';
import { CheckIcon, ChevronRightIcon, ChevronLeftIcon, SpinnerIcon } from '../icons/Icons';

interface LocationSetupSheetProps {
}

// Structured Geographical Data
const geography = {
    'Беларусь': [
        'Минск (город)',
        'Минская область',
        'Брестская область',
        'Витебская область',
        'Гомельская область',
        'Гродненская область',
        'Могилевская область',
        'Другой регион'
    ],
    'Россия': [
        'Москва (город)',
        'Санкт-Петербург (город)',
        'Московская область',
        'Ленинградская область',
        'Краснодарский край',
        'Свердловская область',
        'Республика Татарстан',
        'Новосибирская область',
        'Нижегородская область',
        'Самарская область',
        'Ростовская область',
        'Республика Башкортостан',
        'Челябинская область',
        'Приморский край',
        'Хабаровский край',
        'Другой регион' 
    ],
};

// Cities that are regions themselves - auto-fill logic
const STANDALONE_CITIES: Record<string, string> = {
    'Москва (город)': 'Москва',
    'Санкт-Петербург (город)': 'Санкт-Петербург',
    'Минск (город)': 'Минск',
};

const countryDeclension: Record<string, string> = {
    'Беларусь': 'Беларуси',
    'Россия': 'России',
};

export const LocationSetupSheet: React.FC<LocationSetupSheetProps> = () => {
    const { user, updateUserLocation } = useWallet();
    const { hideModal } = useModal();
    
    // Step 1: Country
    // Step 2: Region List
    // Step 3: Manual Region Entry (Conditional)
    // Step 4: City Entry
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    
    const [country, setCountry] = useState<keyof typeof geography | ''>('');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRegionSelection, setPendingRegionSelection] = useState<string | null>(null);
    
    // Track if we entered manual mode to handle "Back" button correctly
    const [isManualRegionMode, setIsManualRegionMode] = useState(false);

    useEffect(() => {
        if (user?.location) {
            const userCountry = user.location.country as keyof typeof geography;
            const userRegion = user.location.region || '';
            
            setCountry(userCountry);
            setRegion(userRegion);
            setCity(user.location.city);

            // Smart Navigation Logic:
            if (userCountry && userRegion) {
                const predefinedRegions = geography[userCountry] || [];
                // If the region is NOT in the list (or matches "Другой регион" logically), 
                // we assume it was manual input.
                const isPredefined = predefinedRegions.includes(userRegion);
                
                // Special check: If it's a standalone city, user might want to edit location.
                // But for UX consistency, we start at city step usually. 
                // However, for standalone cities, "City" step is redundant.
                // If user wants to change location from "Moscow", they likely want to change Region/Country entirely.
                // So we put them at Step 2 (Region list) if it was a standalone city, or Step 4 (City) if it was a normal region.
                
                if (STANDALONE_CITIES[userRegion]) {
                     // If user is already in Moscow, clicking location likely means they want to change region
                     // So we pre-fill but show Step 2 (Region Selection) as Step 4 doesn't make sense for Moscow (nothing to type)
                     setStep(2); 
                     setIsManualRegionMode(false);
                } else {
                    setIsManualRegionMode(!isPredefined);
                    setStep(4);
                }
            }
        }
    }, [user?.location]);
    
    const regions = useMemo(() => country ? geography[country] : [], [country]);
    
    const isFormValid = country && region && city.trim() !== '';

    const handleCountrySelect = (selectedCountry: keyof typeof geography) => {
        setCountry(selectedCountry);
        setRegion('');
        setCity('');
        setStep(2);
    };

    // Core saving logic extracted to accept args directly to bypass state closure issues
    const executeSave = (countryVal: string, regionVal: string, cityVal: string) => {
        setIsSaving(true);
        setTimeout(() => {
            updateUserLocation({ 
                country: countryVal, 
                region: regionVal.trim(),
                city: cityVal.trim() 
            });
            setIsSaving(false);
            hideModal();
        }, 600);
    };

    const handleRegionSelect = (selectedRegion: string) => {
        // 1. Handle Manual Input ("Other Region")
        if (selectedRegion === 'Другой регион') {
            setIsManualRegionMode(true);
            setRegion(''); // Clear region so user can type it
            setStep(3); // Go to Manual Region Input
            return;
        }
        
        // 2. Handle Standalone Cities (Moscow, Minsk...) - Auto-Save
        if (STANDALONE_CITIES[selectedRegion]) {
            setPendingRegionSelection(selectedRegion); // For loading UI on the specific button
            const autoCity = STANDALONE_CITIES[selectedRegion];
            setRegion(selectedRegion);
            setCity(autoCity);
            
            // Execute save immediately
            executeSave(country, selectedRegion, autoCity);
            return;
        }

        // 3. Standard Region - Go to City Input
        setIsManualRegionMode(false);
        setRegion(selectedRegion);
        setStep(4);
    };

    const handleManualRegionSubmit = () => {
        if (region.trim().length > 0) {
            setStep(4);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else if (step === 3) {
            setStep(2);
            setIsManualRegionMode(false);
        } else if (step === 4) {
            if (isManualRegionMode) {
                setStep(3);
            } else {
                setStep(2);
            }
        }
    };

    const handleSave = () => {
        if (!isFormValid) return;
        executeSave(country, region, city);
    };

    const popularCitiesByRegion: Record<string, string[]> = {
        'Минская область': ['Борисов', 'Солигорск', 'Молодечно', 'Жодино', 'Слуцк'],
        'Брестская область': ['Брест', 'Барановичи', 'Пинск', 'Кобрин'],
        'Московская область': ['Балашиха', 'Химки', 'Подольск', 'Королев', 'Мытищи'],
        'Краснодарский край': ['Краснодар', 'Сочи', 'Новороссийск', 'Анапа'],
    };

    const suggestions = popularCitiesByRegion[region] || [];

    return (
        <div className="p-4 space-y-4 text-center h-[500px] flex flex-col">
            <div className="flex items-center justify-between">
                {step > 1 ? (
                    <button onClick={handleBack} className="flex items-center text-sm text-gray-400 hover:text-white p-2 -ml-2">
                        <ChevronLeftIcon className="w-5 h-5 mr-1" />
                        Назад
                    </button>
                ) : <div className="w-16"></div>}
                
                <div>
                    <h2 className="text-xl font-bold text-white">Локация</h2>
                    {step > 1 && !isSaving && <p className="text-gray-400 text-xs mt-0.5">Настройка местоположения</p>}
                </div>
                
                <div className="w-16"></div>
            </div>
            
            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                
                {/* STEP 1: COUNTRY */}
                {step === 1 && (
                    <div className="space-y-3 animate-fadeIn">
                        <p className="text-sm text-gray-300">Выберите страну</p>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.keys(geography).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => handleCountrySelect(c as keyof typeof geography)}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all group"
                                >
                                    <span className="font-semibold text-lg text-white">{c}</span>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-500 group-hover:text-cyan-400"/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: REGION LIST */}
                {step === 2 && (
                    <div className="space-y-3 animate-fadeIn">
                        <p className="text-sm text-gray-300">
                            Выберите область / регион в {countryDeclension[country] || country}
                        </p>
                        <div className="space-y-2 text-left">
                            {regions.map((r) => {
                                const isProcessingThis = pendingRegionSelection === r;
                                return (
                                    <button
                                        key={r}
                                        onClick={() => handleRegionSelect(r)}
                                        disabled={isSaving && !isProcessingThis}
                                        className={`w-full text-left p-3 rounded-lg transition-colors text-white font-medium border-b border-white/5 last:border-0 flex justify-between items-center ${
                                            r === 'Другой регион' 
                                                ? 'bg-white/10 text-cyan-400 hover:bg-white/20' 
                                                : 'bg-white/5 hover:bg-white/10'
                                        } ${isSaving && !isProcessingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{r}</span>
                                        {isProcessingThis && <SpinnerIcon className="w-5 h-5 text-cyan-400 animate-spin" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 3: MANUAL REGION ENTRY */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-left">
                             <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">Страна</p>
                             <p className="text-white font-medium">{country}</p>
                        </div>

                        <div>
                             <label className="text-sm font-medium text-gray-300 block text-left mb-2">Введите название региона (области/края)</label>
                             <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualRegionSubmit()}
                                placeholder="Например: Тульская область"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition text-lg"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 text-left mt-2 pl-1">
                                Введите точное название вашего региона, чтобы мы могли показывать актуальные объявления.
                            </p>
                        </div>

                         <button 
                            onClick={handleManualRegionSubmit}
                            disabled={!region.trim()}
                            className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            Далее
                        </button>
                    </div>
                )}

                {/* STEP 4: CITY / SETTLEMENT */}
                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-left">
                             <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">Выбрано</p>
                             <p className="text-white font-medium">{country}, {region}</p>
                        </div>

                        <div>
                             <label className="text-sm font-medium text-gray-300 block text-left mb-2">Населенный пункт</label>
                             <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="Введите название (город, село, деревня)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition text-lg"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 text-left mt-2 pl-1">
                                Указание точного населенного пункта поможет покупателям быстрее найти ваши товары.
                            </p>
                        </div>

                        {suggestions.length > 0 && (
                            <div className="text-left">
                                <p className="text-xs text-gray-400 mb-2 ml-1">Популярные в этом регионе:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => setCity(s)}
                                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/15 hover:text-white transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FOOTER ACTION */}
            {step === 4 && (
                <button 
                    onClick={handleSave}
                    disabled={!isFormValid || isSaving}
                    className="w-full py-3.5 bg-cyan-500 text-white text-base font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? 'Сохранение...' : (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            Подтвердить
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
