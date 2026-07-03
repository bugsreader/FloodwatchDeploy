import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages } = pagination;
  
  // Basic pagination logic: show max 5 pages around current
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(pages, startPage + 4);
  const adjustedStart = Math.max(1, endPage - 4);
  
  const pageNumbers = [];
  for (let i = adjustedStart; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Page navigation" className="mt-4">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            Previous
          </button>
        </li>
        
        {adjustedStart > 1 && (
          <>
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(1)}>1</button>
            </li>
            {adjustedStart > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
          </>
        )}
        
        {pageNumbers.map(num => (
          <li key={num} className={`page-item ${num === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(num)}>{num}</button>
          </li>
        ))}
        
        {endPage < pages && (
          <>
            {endPage < pages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(pages)}>{pages}</button>
            </li>
          </>
        )}
        
        <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === pages}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
