import { json } from '@sveltejs/kit';

export const GET = async () => {
    console.log('load GET');
    const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
    ];

    return json(items);
};
