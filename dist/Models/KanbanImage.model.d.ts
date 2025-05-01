import { Model } from "sequelize-typescript";
import KanbanCard from "./KanbanCard.model";
export default class KanbanImage extends Model {
    id: number;
    imageUrl: string;
    subtitle: string;
    kanbanCardId: number;
    card: KanbanCard;
    createdAt: Date;
    updatedAt: Date;
}
