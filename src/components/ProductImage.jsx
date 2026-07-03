export function ProductImage({ src, alt }) {
  if (!src) {
    return <div className="product-image placeholder">Нет фото</div>;
  }

  return (
    <img
      className="product-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = 'none';
        event.currentTarget.nextElementSibling.style.display = 'grid';
      }}
    />
  );
}

export function ProductImageWithFallback({ src, alt }) {
  return (
    <div className="image-wrap">
      <ProductImage src={src} alt={alt} />
      <div className="product-image placeholder hidden">Нет фото</div>
    </div>
  );
}
