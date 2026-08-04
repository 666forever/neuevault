export function bindImageErrors(scope = document) {
  scope.querySelectorAll('img[data-image-fallback]:not([data-bound])').forEach(image => {
    image.dataset.bound = 'true';
    image.addEventListener('error', () => {
      const collectionCard = image.closest('.collection-card');
      if (collectionCard) {
        if (image.classList.contains('cover-alternate')) collectionCard.classList.remove('cover-playing');
        if (image.classList.contains('cover-animated') || image.classList.contains('cover-alternate')) {
          image.remove();
          return;
        }
      }
      if (image.classList.contains('asset-animated')) {
        image.closest('.asset-card')?.classList.remove('asset-playing');
        image.remove();
        return;
      }
      image.closest('.asset-thumb, .collection-cover, .modal-preview, .route-hero')?.classList.add('image-error');
      image.remove();
    }, { once: true });
  });
}
