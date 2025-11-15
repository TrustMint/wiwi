import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';

interface LocationSetupSheetProps {
}

const locations = {
    'Россия': ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Красноярск', 'Самара', 'Уфа', 'Ростов-на-Дону', 'Омск', 'Краснодар', 'Воронеж', 'Пермь'],
    'Беларусь': ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно', 'Брест', 'Бобруйск', 'Барановичи', 'Пинск', 'Орша', 'Мозырь', 'Солигорск', 'Лида', 'Новополоцк', 'Молодечно'],
};

export const LocationSetupSheet: React.FC<LocationSetupSheetProps> = () => {
    const { user, updateUserLocation } = useWallet();
    const { hideModal } = useModal();
    const [country, setCountry] = useState<keyof typeof locations | ''>('');
    const [city, setCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.location) {
            setCountry(user.location.country as keyof typeof locations);
            setCity(user.location.city);
        }
    }, [user?.location]);
    
    const cities = useMemo(() => country ? locations[country] : [], [country]);
    
    const isFormValid = country && city.trim() !== '';

    const handleCountrySelect = (selectedCountry: keyof typeof locations) => {
        setCountry(selectedCountry);
        setCity(''); // Reset city on country change
    };

    const handleSave = () => {
        if (!isFormValid) return;
        setIsSaving(true);
        // Simulate saving
        setTimeout(() => {
            updateUserLocation({ country, city: city.trim() });
            setIsSaving(false);
            hideModal();
        }, 1000);
    };

    return (
        <div className="p-4 space-y-4 text-center">
            <div>
                <h2 className="text-xl font-bold text-white">Ваш город</h2>
                <p className="text-gray-400 mt-1 text-sm">Это поможет нам находить и показывать объявления рядом с вами.</p>
            </div>
            
            <div className="space-y-4 text-left">
               <div>
                    <label className="text-sm font-medium text-gray-300">Страна</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {Object.keys(locations).map((c) => (
                            <button
                                key={c}
                                onClick={() => handleCountrySelect(c as keyof typeof locations)}
                                className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${country === c ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
               </div>

               {country && (
                   <div>
                        <label className="text-sm font-medium text-gray-300">Выберите или введите город</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {cities.map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setCity(c)} 
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${city === c ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <input
                            list="cities-datalist"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Название города..."
                            className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition"
                            disabled={!country}
                        />
                        <datalist id="cities-datalist">
                            {cities.map(c => <option key={c} value={c} />)}
                        </datalist>
                   </div>
               )}

            </div>

            <button 
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
                className="w-full py-3 bg-cyan-500 text-white text-base font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Сохранение...' : 'Сохранить и продолжить'}
            </button>
        </div>
    );
};