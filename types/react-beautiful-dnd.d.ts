import type React from "react"
declare module "react-beautiful-dnd" {
  export type DraggableId = string
  export type DroppableId = string
  export type DragStart = any
  export type DropResult = any
  export type DraggableLocation = any
  export type DroppableProvided = any
  export type DroppableStateSnapshot = any
  export type DraggableProvided = any
  export type DraggableStateSnapshot = any
  export type DragDropContextProps = any
  export type Direction = "horizontal" | "vertical"

  export const DragDropContext: React.ComponentType<DragDropContextProps>
  export const Droppable: React.ComponentType<any>
  export const Draggable: React.ComponentType<any>
}
