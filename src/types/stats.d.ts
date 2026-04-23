export interface OverdueLoanItem {
    id: number;
    userId: number;
    userName: string;
    bookId: number;
    bookTitle: string;
    dueDate: string;
    loanDate: string;
}

export interface LoanStatsResponse {
    activeLoans: number;
    lateLoans: number;
    overdueList: OverdueLoanItem[];
}

export interface TopBorrowedBookItem {
    id: number;
    title: string;
    author: string;
    loanCount: number;
}

export interface CatalogueStatsResponse {
    totalBooks: number;
    totalReservations: number;
    currentReservations: number;
    pastReservations: number;
    topBorrowedBooks: TopBorrowedBookItem[];
}
