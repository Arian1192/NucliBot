export const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Date(date).toLocaleDateString('es-ES', options).split('/').reverse().join('-');
    return formattedDate;
}