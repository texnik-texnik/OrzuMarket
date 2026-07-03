import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { useAuth } from '../../auth/AuthProvider';
import { createSellerProduct, fetchSellerProducts } from '../../services/marketplace';

const initialForm = { name: '', price: '', description: '', photoFile: null, stock: 1 };

export function SellerProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

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
      setError(err.message ?? 'Не удалось загрузить товары');
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
      setError('Можно загрузить только изображение.');
      event.target.value = '';
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setError('Фото слишком большое. Максимум 5 MB.');
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
      setError(err.message ?? 'Не удалось создать товар');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Мои товары</h2>
        <button type="button" onClick={() => setModalOpen(true)}>Добавить товар</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загружаем товары...</p>}

      {!loading && !products.length && <p className="muted">Вы ещё не добавили товары.</p>}

      {!!products.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Фото</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="table-image"><ProductImageWithFallback src={product.photo_url} alt={product.name} /></td>
                  <td>{product.name}</td>
                  <td>{Number(product.price).toLocaleString('ru-RU')} ₽</td>
                  <td>{product.stock}</td>
                  <td>{product.is_active ? 'Активен' : 'Скрыт'}</td>
                  <td>{product.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title="Добавить товар" onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <label>
              Название
              <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required />
            </label>
            <label>
              Цена
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} required />
            </label>
            <label>
              Остаток
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} required />
            </label>
            <label>
              Описание
              <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
            </label>
            <label>
              Фото товара
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>

            {photoPreview && (
              <div className="photo-preview">
                <span>Предпросмотр</span>
                <img src={photoPreview} alt="Предпросмотр товара" />
              </div>
            )}

            <button type="submit" disabled={submitting}>{submitting ? 'Загружаем...' : 'Создать'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
