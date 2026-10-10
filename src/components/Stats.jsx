import './Stats.css';
import { useLanguage } from '../context/LanguageContext';
import { yearsInBusiness } from '../seo/schema';

const Stats = () => {
    const { t } = useLanguage();

    const statsData = [
        // Calculated from the 2014 founding year stated in the About copy.
        // This was hardcoded "10+", which had quietly become wrong — the
        // company has been trading for longer than the site claimed.
        { value: `${yearsInBusiness()}+`, key: 'stat_years' },
        { value: '1500', key: 'stat_tons' },
        { value: '20+', key: 'stat_experts' },
        // NOTE: "50+" has no source anywhere in the project or the database.
        // Left exactly as-is at the owner's instruction, pending verification.
        { value: '50+', key: 'stat_clients' },
    ];

    return (
        <section className="stats-section reveal">
            <div className="stats-container">
                {statsData.map((stat) => (
                    <div key={stat.key} className="stat-item reveal">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{t(stat.key)}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Stats;
