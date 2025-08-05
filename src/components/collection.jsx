import { collections } from '../../data/collection_data';
import './styles/collection.css';
import { FiTrash, FiChevronDown } from 'react-icons/fi';

export default function Collection({ selectedCollection }) {
    const selected = collections.find(col => col.name === selectedCollection);
    

    if (!selected) {
        return <div className="table-container">Collection not found.</div>;
    }

    return (
        <div className="table-container">

            <div className="table">
                <TableRow
                    id="ID"
                    name="Name"
                    filetype="Filetype"
                    date="Date"
                    size="Size"
                    description="Description"
                    isHeader={true}
                />

                {
                    selected.data.map(data => (
                        <TableRow
                            key={data.id}
                            id={data.id}
                            name={data.name}
                            filetype={data.filetype}
                            date={data.date}
                            size={data.size}
                            description={data.description}
                        />
                    ))
                }
            </div>
        </div>
    );
}

function TableRow({ id, name, filetype, date, size, description, isHeader = false }) {
    return (
        <div className={`table-row ${isHeader ? 'table-head' : ''}`}>
            <div>{id}</div>
            <div>{name}</div>
            <div>{filetype}</div>
            <div>{date}</div>
            <div>{size}</div>
            <div>{description}</div>
        </div>
    );
}