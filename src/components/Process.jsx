import './Process.css';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Settings2, ShieldCheck, Ship } from 'lucide-react';

const Process = () => {
    const { t } = useLanguage();

    const steps = [
        {
            number: '01',
            icon: <Sprout size={40} strokeWidth={1.5} />,
            stage: `${t('process_stage')} 01`,
            title: t('process_1_title'),
            desc: t('process_1_desc')
        },
        {
            number: '02',
            icon: <Settings2 size={40} strokeWidth={1.5} />,
            stage: `${t('process_stage')} 02`,
            title: t('process_2_title'),
            desc: t('process_2_desc')
        },
        {
            number: '03',
            icon: <ShieldCheck size={40} strokeWidth={1.5} />,
            stage: `${t('process_stage')} 03`,
            title: t('process_3_title'),
            desc: t('process_3_desc')
        },
        {
            number: '04',
            icon: <Ship size={40} strokeWidth={1.5} />,
            stage: `${t('process_stage')} 04`,
            title: t('process_4_title'),
            desc: t('process_4_desc')
        }
    ];

    return (
        <section className="process-section">
            <div className="process-container">
                <div className="section-header">
                    <span className="section-label">{t('process_label')}</span>
                    <h2 className="section-title">{t('process_title')}</h2>
                    <p className="section-subtitle">{t('process_subtitle')}</p>
                </div>
                
                <div className="process-timeline">
                    <div className="process-main-line"></div>
                    <div className="process-items">
                        {steps.map((step, index) => (
                            <div key={index} className="process-item">
                                <div className="process-point">
                                    <div className="process-icon-box">
                                        {step.icon}
                                    </div>
                                </div>
                                <div className="process-text">
                                    <span className="process-step-label">{step.stage}</span>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Process;

