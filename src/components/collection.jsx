import './styles/collection.css';
import { FiTrash, FiChevronDown } from 'react-icons/fi';

export default function Collection() {
    const rows = [
        {
            id: '1',
            name: 'report.pdf',
            filetype: 'PDF',
            date: '2025-07-29',
            size: '2.4 MB',
            description: 'Annual summary report'
        },
        {
            id: '2',
            name: 'notes.txt',
            filetype: 'Text',
            date: '2025-07-25',
            size: '18 KB',
            description: 'Meeting notes'
        },
        {
            id: '3',
            name: 'logo.png',
            filetype: 'Image',
            date: '2025-07-20',
            size: '540 KB',
            description: 'App logo'
        },
        {
            id: '4',
            name: 'backup.zip',
            filetype: 'ZIP',
            date: '2025-07-10',
            size: '12 MB',
            description: 'Weekly DB backup'
        }
    ];

    return (
        <div className="table-container">
            <div className="table-header">
                <div className='start'>
                    <h2>Fyndr</h2>
                    <FiChevronDown size={16} color='#fff' />
                </div>
                <button className="delete-btn">
                    Delete Database <FiTrash size={16} />
                </button>
            </div>

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

                {rows.map((row) => (
                    <TableRow key={row.id} {...row} />
                ))}
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