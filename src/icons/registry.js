const fill = (path, viewBox = '0 0 24 24') => ({ viewBox, body: `<path fill="currentColor" d="${path}"/>` });
const stroke = body => ({
  viewBox: '0 0 24 24',
  body: `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,
});

export const iconRegistry = Object.freeze({
  download: stroke('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
  share: stroke('<path d="M14 5h5v5"/><path d="m19 5-9 9"/><path d="M18 13v6H5V6h6"/>'),
  close: stroke('<path d="m6 6 12 12M18 6 6 18"/>'),
  previous: stroke('<path d="m15 18-6-6 6-6"/>'),
  next: stroke('<path d="m9 18 6-6-6-6"/>'),
  back: stroke('<path d="m15 18-6-6 6-6"/><path d="M9 12h10"/>'),
  restricted: stroke('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  menu: stroke('<path d="M4 8h16M4 16h16"/>'),
  'close-menu': stroke('<path d="m6 6 12 12M18 6 6 18"/>'),
  discord: {
    viewBox: '0 0 32 32',
    body: '<path fill="currentColor" d="M26.413 6.536a27.1 27.1 0 0 0-6.189-1.904 18.9 18.9 0 0 0-.793 1.612 23 23 0 0 0-6.869 0 18.5 18.5 0 0 0-.793-1.612 27.2 27.2 0 0 0-6.194 1.909C1.658 12.336.596 17.987 1.127 23.558a30.7 30.7 0 0 0 7.591 3.811 18.8 18.8 0 0 0 1.626-2.622 17 17 0 0 1-2.56-1.222l.628-.472a17.8 17.8 0 0 0 15.177 0l.628.472a17.3 17.3 0 0 1-2.565 1.225 18.8 18.8 0 0 0 1.626 2.619 30.8 30.8 0 0 0 7.596-3.808c.623-6.461-1.064-12.06-4.46-17.025ZM11.017 20.132c-1.479 0-2.702-1.343-2.702-2.994s1.18-3.006 2.697-3.006 2.73 1.354 2.704 3.006-1.192 2.994-2.699 2.994Zm9.967 0c-1.482 0-2.699-1.343-2.699-2.994s1.18-3.006 2.699-3.006 2.723 1.354 2.697 3.006-1.189 2.994-2.697 2.994Z"/>',
  },
  bookmark: fill('M18 1H6a3 3 0 0 0-3 3v19.805l9-5.625 9 5.625V4a3 3 0 0 0-3-3Z'),
  bolt: fill('M13 2a1 1 0 0 1 1 1v6h5a1 1 0 0 1 .808 1.588l-8 11A1 1 0 0 1 10 21v-6H5a1 1 0 0 1-.808-1.588l8-11A1 1 0 0 1 13 2Z', '3 1 18 22'),
});

export const iconNames = Object.freeze(Object.keys(iconRegistry));
