import './Skeleton.css';

const Skeleton = ({ type, className = '', style }) => {
    const classes = `skeleton skeleton-${type} ${className}`;
    return <div className={classes} style={style} />;
};

export const ProductCardSkeleton = () => (
    <div className="product-card-skeleton">
        <Skeleton type="rect" className="sk-image" />
        <Skeleton type="text" className="sk-title" />
        <Skeleton type="text" className="sk-text" />
        <Skeleton type="text" className="sk-text" style={{ width: '60%' }} />
        <Skeleton type="rect" className="sk-button" />
    </div>
);

export const ProductDetailSkeleton = () => (
    <div className="product-detail-page">
        <nav className="pd-breadcrumb">
            <Skeleton type="text" style={{ width: '200px' }} />
        </nav>
        <div className="pd-main">
            <div className="pd-image-wrap" style={{ boxShadow: 'none' }}>
                <Skeleton type="rect" style={{ height: '100%', borderRadius: '0' }} />
            </div>
            <div className="pd-info">
                <Skeleton type="title" style={{ height: '3rem' }} />
                <Skeleton type="text" />
                <Skeleton type="text" />
                <Skeleton type="text" style={{ width: '80%' }} />
                <div className="pd-actions" style={{ marginTop: '2rem' }}>
                    <Skeleton type="rect" className="sk-pd-action" />
                    <Skeleton type="rect" className="sk-pd-action sk-pd-action--secondary" />
                </div>
            </div>
        </div>
    </div>
);

export default Skeleton;
