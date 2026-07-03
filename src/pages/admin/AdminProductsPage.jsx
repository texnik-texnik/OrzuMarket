import { useEffect, useState } from 'react';
import { ProductImageWithFallback } from '../../components/ProductImage';
import { deleteProduct, fetchAdminProducts, setProductActive } from '../../services/marketplace';

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await fetchAdminProducts());
    } catch (err) {
      setError(err.message ?? 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
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
      setError(err.message ?? 'Не удалось обновить товар');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(`Удалить товар «${product.name}»? Если по нему есть заказы, Supabase может запретить удаление — тогда используйте «Скрыть».`);
    if (!ok) return;

    setUpdatingId(product.id);
    setError('');
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      setError(err.message ?? 'Не удалось удалить товар');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Модерация товаров</h2>
        <button type="button" className="secondary" onClick={loadProducts}>Обновить</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загружаем товары...</p>}

      {!!products.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Фото</th>
                <th>Название</th>
                <th>Продавец</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
                <th>Модерация</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={!product.is_active ? 'row-muted' : ''}>
                  <td className="table-image"><ProductImageWithFallback src={product.photo_url} alt={product.name} /></td>
                  <td>{product.name}</td>
                  <td>{product.seller?.email ?? product.seller_id}</td>
                  <td>{Number(product.price).toLocaleString('ru-RU')} ₽</td>
                  <td>{product.stock}</td>
                  <td>{product.is_active ? 'Активен' : 'Скрыт'}</td>
                  <td className="actions-cell">
                    <button type="button" className="secondary" disabled={updatingId === product.id} onClick={() => toggleActive(product)}>
                      {product.is_active ? 'Скрыть' : 'Показать'}
                    </button>
                    <button type="button" className="danger" disabled={updatingId === product.id} onClick={() => handleDelete(product)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
