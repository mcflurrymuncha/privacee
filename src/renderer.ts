interface TabInstance {
  id: string;
  tabElement: HTMLDivElement;
  webviewElement: any;
}

let tabs: TabInstance[] = [];
let activeTabId: string | null = null;

const tabContainer = document.getElementById('tab-container') as HTMLDivElement;
const newTabBtn = document.getElementById('new-tab-btn') as HTMLButtonElement;
const viewContainer = document.getElementById('view-container') as HTMLDivElement;
const urlBar = document.getElementById('url-bar') as HTMLInputElement;

const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
const forwardBtn = document.getElementById('forward-btn') as HTMLButtonElement;
const reloadBtn = document.getElementById('reload-btn') as HTMLButtonElement;
const goBtn = document.getElementById('go-btn') as HTMLButtonElement;

function createUniqueId(): string {
  return 'tab-' + Math.random().toString(36).substr(2, 9);
}

function createNewTab(url: string = 'https://duckduckgo.com') {
  const id = createUniqueId();

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.setAttribute('data-id', id);
  tabEl.innerHTML = `
    <span class="tab-title">loading...</span>
    <span class="close-tab">x</span>
  `;

  const webviewEl = document.createElement('webview');
  webviewEl.setAttribute('id', id);
  webviewEl.setAttribute('partition', 'private'); 
  webviewEl.setAttribute('src', url);

  tabContainer.insertBefore(tabEl, newTabBtn);
  viewContainer.appendChild(webviewEl);

  const instance: TabInstance = { id, tabElement: tabEl, webviewElement: webviewEl };
  tabs.push(instance);

  tabEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('close-tab')) {
      e.stopPropagation();
      closeTabInstance(id);
    } else {
      switchActiveTab(id);
    }
  });

  webviewEl.addEventListener('page-title-updated', (e: any) => {
    const titleSpan = tabEl.querySelector('.tab-title') as HTMLSpanElement;
    if (titleSpan) titleSpan.innerText = e.title.toLowerCase();
  });

  const syncUrlHandler = (e: any) => {
    if (activeTabId === id) {
      urlBar.value = e.url;
    }
  };
  webviewEl.addEventListener('did-navigate', syncUrlHandler);
  webviewEl.addEventListener('did-navigate-in-page', syncUrlHandler);

  switchActiveTab(id);
}

function switchActiveTab(id: string) {
  activeTabId = id;

  tabs.forEach(t => {
    if (t.id === id) {
      t.tabElement.classList.add('active');
      t.webviewElement.classList.add('active');
      urlBar.value = t.webviewElement.getURL?.() || t.webviewElement.src;
    } else {
      t.tabElement.classList.remove('active');
      t.webviewElement.classList.remove('active');
    }
  });
}

function closeTabInstance(id: string) {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;

  const instance = tabs[index];
  instance.tabElement.remove();
  instance.webviewElement.remove();
  tabs.splice(index, 1);

  if (activeTabId === id) {
    if (tabs.length > 0) {
      const nextActiveIndex = Math.max(0, index - 1);
      switchActiveTab(tabs[nextActiveIndex].id);
    } else {
      activeTabId = null;
      urlBar.value = '';
      createNewTab();
    }
  }
}

function handleNavigationInput() {
  if (!activeTabId) return;
  const targetInstance = tabs.find(t => t.id === activeTabId);
  if (!targetInstance) return;

  let targetUrl = urlBar.value.trim();
  
  if (!targetUrl.includes('.') || targetUrl.includes(' ')) {
    targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
  } else if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }
  
  targetInstance.webviewElement.src = targetUrl;
}

goBtn.addEventListener('click', handleNavigationInput);
urlBar.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleNavigationInput(); });
newTabBtn.addEventListener('click', () => createNewTab());

backBtn.addEventListener('click', () => {
  const current = tabs.find(t => t.id === activeTabId);
  if (current?.webviewElement.canGoBack()) current.webviewElement.goBack();
});

forwardBtn.addEventListener('click', () => {
  const current = tabs.find(t => t.id === activeTabId);
  if (current?.webviewElement.canGoForward()) current.webviewElement.goForward();
});

reloadBtn.addEventListener('click', () => {
  const current = tabs.find(t => t.id === activeTabId);
  current?.webviewElement.reload();
});

window.addEventListener('DOMContentLoaded', () => {
  createNewTab();
});
