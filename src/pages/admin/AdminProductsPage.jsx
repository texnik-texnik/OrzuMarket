import React, { useEffect, useState } from 'react';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { deleteProduct, fetchAdminProducts, setProductActive } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { TableRowSkeleton } from '../../components/SkeletonLoaders';

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { t, lang } = useTranslation();

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await fetchAdminProducts());
    } catch (err) {
      setError(err.message ?? t('errorLoadProducts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchProduct = (productId, patch) => {
    setProducts((current) => current.map((item) => item.id === productId ? { ...item, ...patch } : item));
  };

  const toggleActive = async (product) => {
    setUpdatingId(product.id);
    setError('');
    try {
      await setProductActive(product.id, !product.is_active);
      patchProduct(product.id, { is_active: !product.is_active });
    } catch (err) {
      setError(err.message ?? t('errorUpdateProduct'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(t('deleteConfirm', { name: product.name }));
    if (!ok) return;

    setUpdatingId(product.id);
    setError('');
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      setError(err.message ?? t('errorDeleteProduct'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>{t('adminProductsTitle')}</h2>
        <button type="button" className="secondary" onClick={loadProducts}>{t('refreshBtn')}</button>
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && !products.length && <p className="muted">{t('noProductsFound')}</p>}

      {(loading || !!products.length) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('tableHeaderPhoto')}</th>
                <th>{t('tableHeaderTitle')}</th>
                <th>{t('tableHeaderSeller')}</th>
                <th>{t('tableHeaderPrice')}</th>
                <th>{t('tableHeaderStock')}</th>
                <th>{t('tableHeaderStatus')}</th>
                <th>{t('tableHeaderAction')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} columns={7} />
                ))
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={!product.is_active ? 'row-muted' : ''}>
                    <td className="table-image"><ProductImageWithFallback src={product.photo_url} alt={product.name} /></td>
                    <td>{product.name}</td>
                    <td>{product.seller?.email ?? product.seller_id}</td>
                    <td>{Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</td>
                    <td>{product.stock}</td>
                    <td>{product.is_active ? t('productStatusActive') : t('productStatusHidden')}</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" disabled={updatingId === product.id} onClick={() => toggleActive(product)}>
                        {product.is_active ? t('actionHide') : t('actionShow')}
                      </button>
                      <button type="button" className="danger" disabled={updatingId === product.id} onClick={() => handleDelete(product)}>
                        {t('deleteBtn')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
