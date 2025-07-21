import { useState, useEffect } from 'react';
import './App.css';

interface Bookmark {
  id: string;
  title: string;
  url?: string;
  children?: Bookmark[];
}

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

function NewTab() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [draggedTab, setDraggedTab] = useState<Tab | null>(null);

  useEffect(() => {
    // Load bookmarks when component mounts
    chrome.bookmarks.getTree((bookmarkTree) => {
      setBookmarks(bookmarkTree[0].children || []);
    });

    // Load open tabs
    chrome.tabs.query({}, (tabs) => {
      console.log('tabs', tabs);
      setTabs(
        tabs.map((tab) => ({
          id: tab.id!,
          title: tab.title!,
          url: tab.url!,
          favIconUrl: tab.favIconUrl,
        }))
      );
    });
  }, []);

  const openBookmark = (url: string) => {
    chrome.tabs.update({ url });
  };

  const handleDragStart = (tab: Tab) => {
    setDraggedTab(tab);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
  };

  const handleDrop = (folderId: string) => {
    if (draggedTab) {
      chrome.bookmarks.create(
        {
          parentId: folderId,
          title: draggedTab.title,
          url: draggedTab.url,
        },
        () => {
          // Refresh bookmarks after adding
          chrome.bookmarks.getTree((bookmarkTree) => {
            setBookmarks(bookmarkTree[0].children || []);
          });
        }
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderBookmarks = (bookmarkList: Bookmark[]) => {
    return bookmarkList.map((bookmark) => (
      <div
        key={bookmark.id}
        className="bookmark-item"
        onDrop={() => !bookmark.url && handleDrop(bookmark.id)}
        onDragOver={handleDragOver}
      >
        {bookmark.url ? (
          <button
            onClick={() => openBookmark(bookmark.url!)}
            className="bookmark-link"
          >
            {bookmark.title}
          </button>
        ) : (
          <div className={`bookmark-folder ${draggedTab ? 'drop-target' : ''}`}>
            <h3>{bookmark.title}</h3>
            {bookmark.children && renderBookmarks(bookmark.children)}
          </div>
        )}
      </div>
    ));
  };

  const renderTabs = () => {
    return tabs.map((tab) => (
      <div
        key={tab.id}
        className="tab-item"
        draggable
        onDragStart={() => handleDragStart(tab)}
        onDragEnd={handleDragEnd}
      >
        <div className="tab-favicon">
          {tab.favIconUrl ? (
            <img src={tab.favIconUrl} alt="" width="16" height="16" />
          ) : (
            <div className="default-favicon">🌐</div>
          )}
        </div>
        <div className="tab-info">
          <div className="tab-title">{tab.title}</div>
          <div className="tab-url">{new URL(tab.url).hostname}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className="newtab-container">
      <header className="newtab-header">
        <h1>Desktabs</h1>
      </header>

      <div className="main-content">
        <main className="bookmarks-grid">{renderBookmarks(bookmarks)}</main>

        <aside className="tabs-sidebar">
          <h2>Open Tabs</h2>
          <div className="">{renderTabs()}</div>
          <div className="drag-instruction">
            {draggedTab
              ? 'Drop into a bookmark folder'
              : 'Drag tabs to bookmark folders'}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NewTab;
