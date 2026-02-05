import Card3D from './Card3D';
import type { ContentItem } from '../data/db';

interface CardGridProps {
    items: ContentItem[];
    onCardClick?: (item: ContentItem) => void;
}

export default function CardGrid({ items, onCardClick }: CardGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
            {items.map((item) => (
                <Card3D
                    key={item.id}
                    item={item}
                    onClick={() => onCardClick?.(item)}
                />
            ))}
        </div>
    );
}
