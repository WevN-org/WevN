// import { collections } from '../../data/collection_data';
import { ApiService } from '../services/apiservice';
import React, { useEffect, useState} from 'react';
import './styles/sidebar.css';
import { FiSearch, FiArchive, FiTrash } from 'react-icons/fi'; // Feather Icons
import { IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { useLocation } from 'react-router-dom';


export default function Sidebar({ onClick, selectedCollection }) {

    const location = useLocation();


    const [collections, setCollections] = useState([]);
    useEffect(() => {
    ApiService.getCollections()
      .then((res) => {
        setCollections(res);
        console.log('📦 Loaded collections');
      })
      .catch((e) => {
        console.log(`❌ Failed to load collections: ${e.message || e}`);
      });
  }, []);
    return (
        <aside className="sidebar">
            <div>
                <div className="search-bar">
                    <FiSearch size={16} color='#fff' />
                    <input type="text" placeholder="search databases" />
                </div>

                <nav className="database-list">
                    {
                        collections.map(collection => (
                            <div className='menu-wrapper'>
                                <div key={collection.name} className={`menu-item ${collection.name === selectedCollection ? 'active' : ''}`} onClick={() => onClick(collection.name)}>
                                    {collection.name}
                                </div>
                                <div className="menu-icons">
                                    {/*<FiArchive size={16} />*/}
                                    <div className="menu-icons__delete">
                                        <MdDelete color='#fff' onClick={() => ApiService.deleteCollection(collection.name)} />
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </nav>
            </div>

            {/*<div className="archive-bar">
                <span>Archive</span>
                <FiArchive size={16} color='#fff' />
            </div>*/}
            {
                //location.pathname === '/graph' ? (
                //    <GraphToggle />
                //) : 
                location.pathname === '/' ? (
                    <div className="sidebar-action">
                        <span>Create Collection</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                ) : (
                    <div className="sidebar-action">
                        <span>Create Node</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                )
            }

        </aside>
    );
}

