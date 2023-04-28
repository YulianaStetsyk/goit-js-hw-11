// Імпортуємо необхідні модулі
import ImagesApiService from './js/images-service';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

// Отримуємо посилання на потрібні елементи в DOM
const refs = {
  galleryContainer: document.querySelector('.gallery'),
  searchForm: document.querySelector('.search-form'),
  toTopBtn: document.querySelector('.to-top'),
  wrapper: document.querySelector('.wrapper'),
};

// Створюємо екземпляр класу ImagesApiService
const imagesApiService = new ImagesApiService();

// Створюємо галерею за допомогою SimpleLightbox
const gallery = new SimpleLightbox('.gallery a');

// Налаштовуємо параметри для IntersectionObserver
const optionsForObserver = {
  rootMargin: '250px',
};

// Створюємо новий IntersectionObserver
const observer = new IntersectionObserver(onEntry, optionsForObserver);

// Додаємо обробник події submit на форму пошуку
refs.searchForm.addEventListener('submit', onSearch);
// Додаємо обробник події click на кнопку to-top
refs.toTopBtn.addEventListener('click', onTopScroll);

// Додаємо обробник події scroll на вікно
window.addEventListener('scroll', onScrollToTopBtn);
// Функція, для пошуку зображень за введеним запитом
function onSearch(e) {
  e.preventDefault();
// Отримуємо значення поля пошуку
  imagesApiService.query = e.currentTarget.elements.searchQuery.value.trim();
// Скидаємо лічильники та очищуємо контейнер зображень
  imagesApiService.resetLoadedHits();
  imagesApiService.resetPage();
  // Очищуємо контейнер галереї
  clearGelleryContainer();
 //  Якщо запит порожній, виводимо помилку
  if (!imagesApiService.query) {
    return erorrQuery();
  }
// Виконуємо запит на отримання зображень та обробляємо відповідь
  imagesApiService.fetchImages().then(({ hits, totalHits }) => {
    // Я Якщо зображень не знайдено, виводимо помилку
    if (!hits.length) {
      return erorrQuery();
    }
// Налаштовуємо IntersectionObserver, щоб завантажувати наступну порцію зображень
    observer.observe(refs.wrapper);
// Збільшуємо лічильники та створюємо розмітку зображень
    imagesApiService.incrementLoadedHits(hits);
    createGalleryMarkup(hits);
    accessQuery(totalHits);
    gallery.refresh();
 // Якщо вже завантажено всі зображення, перестаємо спостерігати
    if (hits.length === totalHits) {
      observer.unobserve(refs.wrapper);
      endOfSearch();
    }
  });

  observer.unobserve(refs.wrapper);
}
//Безкінечний скрол
function onEntry(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting && imagesApiService.query) {
      imagesApiService
        .fetchImages()
        .then(({ hits, totalHits }) => {
          imagesApiService.incrementLoadedHits(hits);
          if (totalHits <= imagesApiService.loadedHits) {
            observer.unobserve(refs.wrapper);
            endOfSearch();
          }

          createGalleryMarkup(hits);
          //для плавного прокручування екрану
          smoothScrollGallery();
          //для оновлення галереї після додавання нових зображень
          gallery.refresh();
        })
        .catch(error => {
          console.warn(`${error}`);
        });
    }
  });
}

//Відображаємо повідомлення про те, що зображення знайдено і показуємо кількість
function accessQuery(totalHits) {
  Notify.success(`Hooray! We found ${totalHits} images.`);
}

//Відображаємо повідомлення про те, що користувач досягнув кінця пошуку
function endOfSearch() {
  Notify.info("We're sorry, but you've reached the end of search results.");
}

//Відображаємо повідомлення про те, що не було знайдено зображень за запитом
function erorrQuery() {
  Notify.failure('Sorry, there are no images matching your search query. Please try again.');
}

// Функція для створення розмітки зображень та розміщення їх в контейнері
function clearGelleryContainer() {
  refs.galleryContainer.innerHTML = '';
}

//Створюємо HTML-розмітку зображень та їх розміщення у контейнері галереї
function createGalleryMarkup(images) {
  const markup = images
    .map(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => {
      return `
    <div class="photo-card">
      <a href="${webformatURL}">
        <img
          class="photo-card__img"
          src="${largeImageURL}" 
          alt="${tags}" 
          loading="lazy" 
          width="320"
          height="212"
        />
      </a>
      <div class="info">
        <p class="info-item">
          <b>Likes</b>
          <span>${likes}</span>
        </p>
        <p class="info-item">
          <b>Views</b>
          <span>${views}</span>
        </p>
        <p class="info-item">
          <b>Comments</b>
          <span>${comments}</span>
        </p>
        <p class="info-item">
          <b>Downloads</b>
          <span>${downloads}</span>
        </p>
      </div>
    </div>
    `;
    })
    .join('');

  refs.galleryContainer.insertAdjacentHTML('beforeend', markup);
}
//Перевіряємо прокрутку сторінки
function onScrollToTopBtn() {
  const offsetTrigger = 100;
  const pageOffset = window.pageYOffset;

  pageOffset > offsetTrigger
    ? refs.toTopBtn.classList.remove('is-hidden')
    : refs.toTopBtn.classList.add('is-hidden');
}

function onTopScroll() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

function smoothScrollGallery() {
  const { height } = refs.galleryContainer.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: height * 2,
    behavior: 'smooth',
  });
}
