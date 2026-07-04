import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  ru: {
    // Navigation / Header
    admin: 'Панель администратора',
    sellerDashboard: 'Панель продавца',
    shop: 'Магазин',
    cart: 'Корзина',
    profile: 'Профиль',
    logout: 'Выйти',
    login: 'Войти',
    user: 'Пользователь',
    role: 'роль',
    loading: 'Загрузка...',
    currency: 'сомони',

    // Login page
    loginTitle: 'Вход в Orzu',
    registerTitle: 'Регистрация в Orzu',
    authTabsLogin: 'Вход',
    authTabsRegister: 'Регистрация',
    authDemoNote: '',
    demoModeTitle: 'Демонстрационный режим',
    demoModeRegNote: 'В демонстрационном режиме вы можете создать любой аккаунт, и вход выполнится автоматически.',
    demoModeLoginNote: 'Войдите с помощью тестовых аккаунтов (пароль — любой):',
    fullNameLabel: 'Имя и фамилия',
    fullNamePlaceholder: 'Иван Иванов',
    emailLabel: 'Email',
    emailPlaceholderRegister: 'user@example.com',
    emailPlaceholderLogin: 'seller@example.com',
    passwordLabel: 'Пароль',
    passwordPlaceholder: '••••••••',
    accountTypeLabel: 'Тип аккаунта',
    buyerRoleBtn: '🛍️ Покупатель',
    sellerRoleBtn: '💼 Продавец',
    registerBtn: 'Зарегистрироваться',
    loginBtn: 'Войти',
    registering: 'Регистрация...',
    loggingIn: 'Входим...',
    registrationSuccess: 'Регистрация успешна! Мы отправили письмо с подтверждением на ваш email. Пожалуйста, перейдите по ссылке в письме перед входом.',

    // ShopPage
    marketplaceTitle: 'Маркетплейс',
    marketplaceSub: 'Выбирайте товары, добавляйте в корзину и оформляйте заказ.',
    searchPlaceholder: 'Поиск по названию',
    priceFromPlaceholder: 'Цена от',
    priceToPlaceholder: 'Цена до',
    sortNewest: 'Сначала новые',
    sortCheapest: 'Сначала дешёвые',
    sortExpensive: 'Сначала дорогие',
    sortByName: 'По названию',
    resetFilters: 'Сбросить',
    loadingProducts: 'Загружаем товары...',
    noProductsFound: 'Товаров по выбранным фильтрам не найдено.',
    noDescription: 'Описание пока не добавлено.',
    inStock: 'На складе',
    addedSuccess: 'Добавлено ✓',
    addToCart: 'Добавить в корзину',
    errorLoadProducts: 'Не удалось загрузить товары',

    // CheckoutPage
    checkoutTitle: 'Оформление заказа',
    checkoutNote: 'Пожалуйста, проверьте состав заказа перед его подтверждением.',
    backToShop: 'Вернуться в магазин',
    cartEmpty: 'Корзина пустая.',
    goToProducts: 'Перейти к товарам',
    deleteBtn: 'Удалить',
    totalAmount: 'Итого',
    placeOrder: 'Оформить заказ',
    placingOrder: 'Оформляем...',
    checkoutErrorRole: 'Оформление заказа разрешено только покупателям с role === buyer.',
    checkoutErrorFail: 'Не удалось оформить заказ',

    // ProfilePage
    profileTitle: 'Профиль',
    userIdLabel: 'User ID',
    emailLabelDl: 'Email',
    fullNameLabelDl: 'Полное имя',
    roleLabelDl: 'Роль',
    statusLabelDl: 'Статус',
    statusBlocked: 'Заблокирован',
    statusActive: 'Активен',
    orderHistoryTitle: 'История заказов',
    loadingOrders: 'Загружаем заказы...',
    noOrders: 'Заказов пока нет.',
    orderTableHeaderProduct: 'Товар',
    orderTableHeaderQty: 'Кол-во',
    orderTableHeaderAmount: 'Сумма',
    orderTableHeaderStatus: 'Статус',
    orderTableHeaderDate: 'Дата',
    errorLoadOrders: 'Не удалось загрузить историю заказов',

    // BlockedPage
    blockedTitle: 'Ваш аккаунт заблокирован',
    blockedSub: 'Ваш аккаунт заблокирован администратором.',
    contactSupport: 'Пожалуйста, свяжитесь с поддержкой.',

    // NotFoundPage
    notFoundTitle: 'Страница не найдена',
    notFoundSub: 'Страница, которую вы ищете, не существует.',

    // Admin Pages
    adminInterfaceTitle: 'Интерфейс администратора',
    adminAccessOnly: 'Доступ только для нақша \'admin\'.',
    adminOverview: 'Обзор',
    adminUsers: 'Пользователи',
    adminProducts: 'Товары',
    adminOverviewUsersTitle: 'Пользователи',
    adminOverviewUsersSub: 'Переключить buyer/seller и заблокировать аккаунт.',
    adminOverviewProductsTitle: 'Товары',
    adminOverviewProductsSub: 'Скрыть или удалить товар на маркетплейсе.',
    adminUsersTitle: 'Пользователи',
    refreshBtn: 'Обновить',
    errorLoadUsers: 'Не удалось загрузить пользователей',
    errorChangeRole: 'Не удалось изменить роль',
    errorChangeBlocked: 'Не удалось изменить блокировку',
    tableHeaderEmail: 'Email',
    tableHeaderName: 'Имя',
    tableHeaderRole: 'Роль',
    tableHeaderMakeSeller: 'Сделать продавцом',
    tableHeaderBlock: 'Заблокировать',
    makeSellerCheck: 'Seller',
    makeBuyerCheck: 'Buyer',
    blockedCheck: 'Заблокирован',
    activeCheck: 'Активен',
    adminProductsTitle: 'Модерация товаров',
    tableHeaderPhoto: 'Фото',
    tableHeaderTitle: 'Название',
    tableHeaderSeller: 'Продавец',
    tableHeaderPrice: 'Цена',
    tableHeaderStock: 'Остаток',
    tableHeaderStatus: 'Статус',
    tableHeaderAction: 'Модерация',
    productStatusActive: 'Активен',
    productStatusHidden: 'Скрыт',
    actionHide: 'Скрыть',
    actionShow: 'Показать',
    deleteConfirm: 'Удалить товар «{name}»? Если на него есть заказы, система может отклонить удаление — в таком случае используйте функцию «Скрыть».',
    errorDeleteProduct: 'Не удалось удалить товар',
    errorUpdateProduct: 'Не удалось обновить товар',

    // Seller Pages
    sellerOverviewTitle: 'Панель продавца',
    sellerAccessOnly: 'Доступ только для role === \'seller\'.',
    sellerOverviewProductsTitle: 'Товары',
    sellerOverviewProductsSub: 'Добавить товар и посмотреть список своих товаров.',
    sellerOverviewOrdersTitle: 'Заказы',
    sellerOverviewOrdersSub: 'Список заказов, где фигурируют ваши товары.',
    sellerOrdersTitle: 'Заказы по моим товарам',
    errorLoadOrdersSeller: 'Не удалось загрузить заказы',
    errorChangeStatus: 'Не удалось изменить статус',
    tableHeaderBuyer: 'Покупатель',
    tableHeaderChangeStatus: 'Изменить статус',
    statusInTransitBtn: 'В пути',
    sellerProductsTitle: 'Мои товары',
    addBtn: 'Добавить товар',
    noProductsYet: 'Вы ещё не добавили товары.',
    tableHeaderDescription: 'Описание',
    addProductModalTitle: 'Добавить товар',
    fieldName: 'Название',
    fieldPrice: 'Цена',
    fieldStock: 'Остаток',
    fieldDescription: 'Описание',
    fieldPhoto: 'Фото товара',
    photoPreviewLabel: 'Предпросмотр',
    photoPreviewAlt: 'Предпросмотр товара',
    createBtn: 'Создать',
    creatingBtn: 'Загружаем...',
    errorCreateProduct: 'Не удалось создать товар',
    errorImageOnly: 'Можно загрузить только изображение.',
    errorImageSize: 'Фото слишком большое. Максимум 5 MB.',

    // Statuses
    status_new: 'Новый',
    status_paid: 'Оплачен',
    status_processing: 'В обработке',
    status_shipped: 'В пути',
    status_completed: 'Завершён',
    status_cancelled: 'Отменён',
  },
  tg: {
    // Navigation / Header
    admin: 'Панели маъмур',
    sellerDashboard: 'Панели фурӯшанда',
    shop: 'Мағоза',
    cart: 'Сабад',
    profile: 'Профил',
    logout: 'Баромад',
    login: 'Ворид шудан',
    user: 'Корбар',
    role: 'нақш',
    loading: 'Боргирӣ...',
    currency: 'сомонӣ',

    // Login page
    loginTitle: 'Воридшавӣ ба Orzu',
    registerTitle: 'Бақайдгирӣ дар Orzu',
    authTabsLogin: 'Воридшавӣ',
    authTabsRegister: 'Бақайдгирӣ',
    authDemoNote: '',
    demoModeTitle: 'Ҳолати намоишӣ',
    demoModeRegNote: 'Дар ҳолати намоишӣ шумо метавонед дилхоҳ ҳисоб эҷод кунед ва воридшавӣ худкор иҷро мешавад.',
    demoModeLoginNote: 'Бо истифода аз ҳисобҳои санҷишӣ ворид шавед (парол — дилхоҳ):',
    fullNameLabel: 'Ном ва насаб',
    fullNamePlaceholder: 'Иван Иванов',
    emailLabel: 'Email',
    emailPlaceholderRegister: 'user@example.com',
    emailPlaceholderLogin: 'seller@example.com',
    passwordLabel: 'Парол',
    passwordPlaceholder: '••••••••',
    accountTypeLabel: 'Намуди ҳисоб',
    buyerRoleBtn: '🛍️ Харидор',
    sellerRoleBtn: '💼 Фурӯшанда',
    registerBtn: 'Бақайдгирӣ',
    loginBtn: 'Ворид шудан',
    registering: 'Бақайдгирӣ...',
    loggingIn: 'Воридшавӣ...',
    registrationSuccess: 'Бақайдгирӣ муваффақона анҷом ёфт! Мо ба почтаи электронии шумо паёми тасдиқ фиристодем. Лутфан, пеш аз ворид шудан аз истиноди дохили паём гузаред.',

    // ShopPage
    marketplaceTitle: 'Бозор',
    marketplaceSub: 'Молҳоро интихоб кунед, ба сабад илова кунед ва фармоиш диҳед.',
    searchPlaceholder: 'Ҷустуҷӯ аз рӯи ном',
    priceFromPlaceholder: 'Нарх аз',
    priceToPlaceholder: 'Нарх то',
    sortNewest: 'Аввал нав',
    sortCheapest: 'Аввал арзон',
    sortExpensive: 'Аввал гарон',
    sortByName: 'Аз рӯи ном',
    resetFilters: 'Бозсозӣ',
    loadingProducts: 'Молҳо боргирӣ мешаванд...',
    noProductsFound: 'Мувофиқи филтрҳои интихобшуда ягон мол ёфт нашуд.',
    noDescription: 'Тавсиф ҳанӯз илова нашудааст.',
    inStock: 'Дар анбор',
    addedSuccess: 'Илова шуд ✓',
    addToCart: 'Ба сабад илова кардан',
    errorLoadProducts: 'Боргирии молҳо ноком шуд',

    // CheckoutPage
    checkoutTitle: 'Барасмиятдарории фармоиш',
    checkoutNote: 'Лутфан, пеш аз тасдиқи фармоиш таркиби онро тафтиш кунед.',
    backToShop: 'Бозгашт ба мағоза',
    cartEmpty: 'Сабад холӣ аст.',
    goToProducts: 'Гузаштан ба молҳо',
    deleteBtn: 'Нест кардан',
    totalAmount: 'Ҷамъ',
    placeOrder: 'Фармоиш додан',
    placingOrder: 'Барасмиятдарорӣ...',
    checkoutErrorRole: 'Барасмиятдарории фармоиш танҳо барои харидорон бо нақши buyer иҷозат дода шудааст.',
    checkoutErrorFail: 'Барасмиятдарории фармоиш ноком шуд',

    // ProfilePage
    profileTitle: 'Профил',
    userIdLabel: 'ID-и корбар',
    emailLabelDl: 'Email',
    fullNameLabelDl: 'Номи пурра',
    roleLabelDl: 'Нақш',
    statusLabelDl: 'Ҳолат',
    statusBlocked: 'Масдудшуда',
    statusActive: 'Фаъол',
    orderHistoryTitle: 'Таърихи фармоишҳо',
    loadingOrders: 'Фармоишҳо боргирӣ мешаванд...',
    noOrders: 'Ҳанӯз фармоиш нест.',
    orderTableHeaderProduct: 'Мол',
    orderTableHeaderQty: 'Миқдор',
    orderTableHeaderAmount: 'Маблағ',
    orderTableHeaderStatus: 'Ҳолат',
    orderTableHeaderDate: 'Сана',
    errorLoadOrders: 'Боргирии таърихи фармоишҳо ноком шуд',

    // BlockedPage
    blockedTitle: 'Ҳисоби шумо масдуд шудааст',
    blockedSub: 'Ҳисоби шумо аз ҷониби маъмур масдуд карда шудааст.',
    contactSupport: 'Лутфан, бо хадамоти дастгирӣ тамос гиред.',

    // NotFoundPage
    notFoundTitle: 'Саҳифа ёфт нашуд',
    notFoundSub: 'Саҳифае, ки меҷӯед, вуҷуд надорад.',

    // Admin Pages
    adminInterfaceTitle: 'Интерфейси маъмур',
    adminAccessOnly: 'Дастрасӣ танҳо барои нақши \'admin\'.',
    adminOverview: 'Баррасӣ',
    adminUsers: 'Корбарон',
    adminProducts: 'Молҳо',
    adminOverviewUsersTitle: 'Корбарон',
    adminOverviewUsersSub: 'Иваз кардани нақши харидор/фурӯшанда ва масдуд кардани ҳисоб.',
    adminOverviewProductsTitle: 'Молҳо',
    adminOverviewProductsSub: 'Пинҳон кардан ё нест кардани мол дар бозор.',
    adminUsersTitle: 'Корбарон',
    refreshBtn: 'Навсозӣ',
    errorLoadUsers: 'Боргирии корбарон ноком шуд',
    errorChangeRole: 'Иваз кардани нақш ноком шуд',
    errorChangeBlocked: 'Иваз кардани ҳолати масдудшавӣ ноком шуд',
    tableHeaderEmail: 'Email',
    tableHeaderName: 'Ном',
    tableHeaderRole: 'Нақш',
    tableHeaderMakeSeller: 'Фурӯшанда кардан',
    tableHeaderBlock: 'Масдуд кардан',
    makeSellerCheck: 'Seller',
    makeBuyerCheck: 'Buyer',
    blockedCheck: 'Масдудшуда',
    activeCheck: 'Фаъол',
    adminProductsTitle: 'Мотдиҳии молҳо',
    tableHeaderPhoto: 'Фото',
    tableHeaderTitle: 'Ном',
    tableHeaderSeller: 'Фурӯшанда',
    tableHeaderPrice: 'Нарх',
    tableHeaderStock: 'Миқдор',
    tableHeaderStatus: 'Ҳолат',
    tableHeaderAction: 'Амалиёт',
    productStatusActive: 'Фаъол',
    productStatusHidden: 'Пинҳон',
    actionHide: 'Пинҳон кардан',
    actionShow: 'Нишон додан',
    deleteConfirm: 'Моли «{name}»-ро нест кунед? Агар нисбати он фармоишҳо бошанд, система метавонад несткуниро рад кунад — дар он сурат «Пинҳон кардан»-ро истифода баред.',
    errorDeleteProduct: 'Нест кардани мол ноком шуд',
    errorUpdateProduct: 'Навсозии мол ноком шуд',

    // Seller Pages
    sellerOverviewTitle: 'Панели фурӯшанда',
    sellerAccessOnly: 'Дастрасӣ танҳо барои нақши \'seller\'.',
    sellerOverviewProductsTitle: 'Молҳо',
    sellerOverviewProductsSub: 'Илова кардани мол ва дидани рӯйхати молҳои худ.',
    sellerOverviewOrdersTitle: 'Фармоишҳо',
    sellerOverviewOrdersSub: 'Рӯйхати фармоишҳое, ки молҳои шумо дар онҳо ҳастанд.',
    sellerOrdersTitle: 'Фармоишҳо аз рӯи молҳои ман',
    errorLoadOrdersSeller: 'Боргирии фармоишҳо ноком шуд',
    errorChangeStatus: 'Тағйир додани ҳолат ноком шуд',
    tableHeaderBuyer: 'Харидор',
    tableHeaderChangeStatus: 'Тағйир додани ҳолат',
    statusInTransitBtn: 'Дар роҳ',
    sellerProductsTitle: 'Молҳои ман',
    addBtn: 'Иловаи мол',
    noProductsYet: 'Шумо ҳанӯз мол илова накардаед.',
    tableHeaderDescription: 'Тавсиф',
    addProductModalTitle: 'Иловаи мол',
    fieldName: 'Номи мол',
    fieldPrice: 'Нарх',
    fieldStock: 'Миқдор дар анбор',
    fieldDescription: 'Тавсиф',
    fieldPhoto: 'Сурати мол',
    photoPreviewLabel: 'Пешнамоиш',
    photoPreviewAlt: 'Пешнамоиши мол',
    createBtn: 'Эҷод кардан',
    creatingBtn: 'Боргирӣ...',
    errorCreateProduct: 'Эҷоди мол ноком шуд',
    errorImageOnly: 'Танҳо файлҳои суратро боргирӣ кардан мумкин аст.',
    errorImageSize: 'Сурат хеле калон аст. Ҳадди аксар 5 MB.',

    // Statuses
    status_new: 'Нав',
    status_paid: 'Пардохтшуда',
    status_processing: 'Дар коркард',
    status_shipped: 'Дар роҳ',
    status_completed: 'Анҷомёфта',
    status_cancelled: 'Бекоршуда',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('orzu_lang') || 'ru';
  });

  const setLang = (newLang) => {
    if (newLang === 'ru' || newLang === 'tg') {
      setLangState(newLang);
      localStorage.setItem('orzu_lang', newLang);
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, replacements = {}) => {
    const translationSet = translations[lang] || translations['ru'];
    let text = translationSet[key] || translations['ru'][key] || key;
    
    // Replace placeholders like {name}
    Object.keys(replacements).forEach((k) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), replacements[k]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
