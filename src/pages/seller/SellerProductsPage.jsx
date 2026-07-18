import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useAuth } from '../../auth/AuthProvider';
import { createSellerProduct, fetchSellerProducts, deleteProduct, PRODUCT_CATEGORIES } from '../../services/marketplace';
import { useTranslation } from '../../localization/LanguageProvider';
import { TableRowSkeleton } from '../../components/SkeletonLoaders';
import { getCategoryIcon } from '../common/ShopPage';

const initialForm = { name: '', price: '', description: '', photoFile: null, stock: 1, category: '' };

export function SellerProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const { t, lang } = useTranslation();

  const handleDelete = async (product) => {
    const ok = window.confirm(t('deleteConfirm', { name: product.name }) || `Удалить товар "${product.name}"?`);
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

  const photoPreview = useMemo(() => {
    if (!form.photoFile) return '';
    return URL.createObjectURL(form.photoFile);
  }, [form.photoFile]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await fetchSellerProducts(user.id));
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

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    if (file && !file.type.startsWith('image/')) {
      setError(t('errorImageOnly'));
      event.target.value = '';
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setError(t('errorImageSize'));
      event.target.value = '';
      return;
    }

    setError('');
    setForm((value) => ({ ...value, photoFile: file }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const product = await createSellerProduct({ sellerId: user.id, ...form });
      setProducts((current) => [product, ...current]);
      closeModal();
    } catch (err) {
      setError(err.message ?? t('errorCreateProduct'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>{t('sellerProductsTitle')}</h2>
        <button type="button" onClick={() => setModalOpen(true)}>{t('addBtn')}</button>
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && !products.length && <p className="muted">{t('noProductsYet')}</p>}

      {(loading || !!products.length) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('tableHeaderPhoto')}</th>
                <th>{t('tableHeaderTitle')}</th>
                <th>{t('fieldCategory')}</th>
                <th>{t('tableHeaderPrice')}</th>
                <th>{t('tableHeaderStock')}</th>
                <th>{t('tableHeaderStatus')}</th>
                <th>{t('tableHeaderModeration')}</th>
                <th>{t('tableHeaderDescription')}</th>
                <th>{t('tableHeaderAction')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} columns={9} />
                ))
              ) : (
                products.map((product) => {
                  const modStatus = product.moderation_status || 'approved';
                  return (
                    <tr key={product.id} className={modStatus === 'rejected' ? 'row-muted' : ''}>
                      <td className="table-image"><ProductImageWithFallback src={product.photo_url} alt={product.name} /></td>
                      <td>{product.name}</td>
                      <td>
                        <span className="category-badge">
                          {getCategoryIcon(product.category)} {t(`category_${product.category || 'other'}`)}
                        </span>
                      </td>
                      <td>{Number(product.price).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU')} {t('currency')}</td>
                      <td>{product.stock}</td>
                      <td>{product.is_active ? t('productStatusActive') : t('productStatusHidden')}</td>
                      <td>
                        <span className={`status-badge moderation-${modStatus}`}>
                          {t(`moderation_status_${modStatus}`)}
                        </span>
                      </td>
                      <td>{product.description || '—'}</td>
                      <td className="actions-cell">
                        <button type="button" className="danger" disabled={updatingId === product.id} onClick={() => handleDelete(product)}>
                          {t('deleteBtn')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={t('addProductModalTitle')} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <label>
              {t('fieldName')}
              <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required />
            </label>
            <label>
              {t('fieldCategory')}
              <select
                value={form.category}
                onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))}
                required
              >
                <option value="" disabled>{t('categorySelect')}</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {t(`category_${cat}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('fieldPrice')}
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} required />
            </label>
            <label>
              {t('fieldStock')}
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} required />
            </label>
            <label>
              {t('fieldDescription')}
              <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
            </label>
            <label>
              {t('fieldPhoto')}
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>

            {photoPreview && (
              <div className="photo-preview">
                <span>{t('photoPreviewLabel')}</span>
                <img src={photoPreview} alt={t('photoPreviewAlt')} />
              </div>
            )}

            {error && <p className="error" style={{ margin: '14px 0', padding: '10px 14px' }}>{error}</p>}
            <button type="submit" disabled={submitting}>{submitting ? t('creatingBtn') : t('createBtn')}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
