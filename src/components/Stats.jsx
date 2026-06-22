import './Stats.css';
import { useLanguage } from '../context/LanguageContext';

const Stats = () => {
    const { t } = useLanguage();
    
    const statsData = [
        { value: '10+', key: 'stat_years' },
        { value: '1500', key: 'stat_tons' },
        { value: '20+', key: 'stat_experts' },
        { value: '50+', key: 'stat_clients' }
    ];

    return (
        <section className="stats-section reveal">
            <div className="stats-container">
                {statsData.map((stat, index) => (
                    <div key={index} className={`stat-item reveal reveal-delay-${index + 1}`}>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{t(stat.key)}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Stats;
