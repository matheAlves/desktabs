import { useState, useEffect } from 'react';
import './App.css';
import { store } from './store/store.ts';
import type { Collection, BookmarkUrl, Tab } from './store/store.ts';
import { StorageStrategyDemo } from './StorageStrategyDemo';

function NewTab() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [draggedTab, setDraggedTab] = useState<Tab | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeStore = async () => {
      try {
        setIsLoading(true);
        // Load collections from store adapter
        const loadedCollections = await store.getCollections();
        setCollections(loadedCollections);
      } catch (error) {
        console.error('Failed to initialize store:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStore();

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

  const handleDrop = async (collectionId: string) => {
    if (draggedTab) {
      try {
        const bookmark = await store.addBookmarkToCollection(
          collectionId,
          draggedTab
        );
        if (bookmark) {
          const updatedCollections = await store.getCollections();
          setCollections(updatedCollections);
        }
      } catch (error) {
        console.error('Failed to add bookmark:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const createNewCollection = async () => {
    if (newCollectionName.trim()) {
      try {
        await store.createCollection(newCollectionName.trim());
        const updatedCollections = await store.getCollections();
        setCollections(updatedCollections);
        setNewCollectionName('');
        setIsCreatingCollection(false);
      } catch (error) {
        console.error('Failed to create collection:', error);
      }
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      try {
        await store.deleteCollection(collectionId);
        const updatedCollections = await store.getCollections();
        setCollections(updatedCollections);
      } catch (error) {
        console.error('Failed to delete collection:', error);
      }
    }
  };

  const removeBookmark = async (collectionId: string, bookmarkId: string) => {
    try {
      await store.removeBookmarkFromCollection(collectionId, bookmarkId);
      const updatedCollections = await store.getCollections();
      setCollections(updatedCollections);
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const renderBookmarksInCollection = (
    bookmarks: BookmarkUrl[],
    collectionId: string
  ) => {
    return bookmarks.map((bookmark) => (
      <div key={bookmark.id} className="bookmark-url">
        <div className="bookmark-favicon">
          {bookmark.faviconUrl ? (
            <img src={bookmark.faviconUrl} alt="" width="16" height="16" />
          ) : (
            <div className="default-favicon">🌐</div>
          )}
        </div>
        <button
          onClick={() => openBookmark(bookmark.url)}
          className="bookmark-link"
          title={bookmark.url}
        >
          {bookmark.name}
        </button>
        <button
          onClick={() => removeBookmark(collectionId, bookmark.id)}
          className="remove-bookmark"
          title="Remove bookmark"
        >
          ×
        </button>
      </div>
    ));
  };

  const renderCollections = () => {
    return collections.map((collection) => (
      <div
        key={collection.id}
        className={`collection-item ${draggedTab ? 'drop-target' : ''}`}
        onDrop={() => handleDrop(collection.id)}
        onDragOver={handleDragOver}
      >
        <div className="collection-header">
          <h3>{collection.name}</h3>
          <button
            onClick={() => deleteCollection(collection.id)}
            className="delete-collection"
            title="Delete collection"
          >
            🗑️
          </button>
        </div>
        <div className="bookmarks-list">
          {collection.bookmarks.length > 0 ? (
            renderBookmarksInCollection(collection.bookmarks, collection.id)
          ) : (
            <div className="empty-collection">
              {draggedTab ? 'Drop tab here to bookmark' : 'No bookmarks yet'}
            </div>
          )}
        </div>
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

  if (isLoading) {
    return (
      <div className="newtab-container">
        <header className="newtab-header">
          <h1>DesKTabs</h1>
        </header>
        <div className="loading-container">
          <div className="loading-spinner">Loading your collections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="newtab-container">
      <StorageStrategyDemo />
      <header className="newtab-header">
        <h1>DesKTabs</h1>
      </header>

      <div className="main-content">
        <main className="collections-grid">
          {renderCollections()}

          <div className="new-collection-card">
            {isCreatingCollection ? (
              <div className="create-collection-form">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="collection-name-input"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && createNewCollection()}
                />
                <div className="form-buttons">
                  <button onClick={createNewCollection} className="create-btn">
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingCollection(false);
                      setNewCollectionName('');
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingCollection(true)}
                className="add-collection-btn"
              >
                <span className="plus-icon">+</span>
                <span>New Collection</span>
              </button>
            )}
          </div>
        </main>

        <aside className="tabs-sidebar">
          <h2>Open Tabs ({tabs.length})</h2>
          <div className="tabs-list">{renderTabs()}</div>
          <div className="drag-instruction">
            {draggedTab
              ? 'Drop into a collection to bookmark'
              : 'Drag tabs to collections to bookmark them'}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NewTab;
