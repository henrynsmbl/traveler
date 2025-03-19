'use client'

import { useState } from 'react'
import { Check, Edit2 } from 'lucide-react'

export interface TableColumn {
  header: string
  editable?: boolean
}

export interface TableData {
  columns: TableColumn[]
  rows: (string | number)[][]
  editable?: boolean
}

interface StaticTableProps {
  data: TableData
}

interface EditableTableProps {
  data: TableData
  onSave: (newData: TableData) => void
}

export function StaticTable({ data }: StaticTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead>
        <tr>
          {data.columns.map((column, i) => (
            <th
              key={i}
              className="px-4 py-2 text-left text-sm font-semibold bg-gray-50 dark:bg-gray-800"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, colIndex) => (
              <td
                key={colIndex}
                className="px-4 py-2 text-sm"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function EditableTable({ data, onSave }: EditableTableProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedData, setEditedData] = useState<TableData>(data)
  
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
      // Security check: Prevent changes to non-editable columns
      if (!editedData.columns[colIndex].editable) {
        console.warn('Attempted to edit a non-editable column')
        return
      }
  
      const newData = { ...editedData }
      newData.rows[rowIndex][colIndex] = value
      setEditedData(newData)
    }
  
    const handleSave = () => {
      // Additional security check: Verify no non-editable columns were modified
      const hasUnauthorizedChanges = editedData.rows.some((row, rowIndex) => 
        row.some((cell, colIndex) => {
          const isEditableColumn = editedData.columns[colIndex].editable
          const originalValue = data.rows[rowIndex][colIndex]
          return !isEditableColumn && cell !== originalValue
        })
      )
  
      if (hasUnauthorizedChanges) {
        console.error('Unauthorized changes detected')
        // Reset to original data
        setEditedData(data)
        setIsEditing(false)
        return
      }
  
      onSave(editedData)
      setIsEditing(false)
    }
    
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && isEditing) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="absolute -top-3 -right-3 p-2 text-gray-600 dark:text-gray-300 
                   hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 
                   rounded-full shadow-lg border border-gray-200 dark:border-gray-600"
      >
        {isEditing ? (
          <Check size={18} onClick={handleSave} className="text-green-500 hover:text-green-600" />
        ) : (
          <Edit2 size={18} className="text-blue-500 hover:text-blue-600" />
        )}
      </button>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {editedData.columns.map((column, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left text-sm font-semibold bg-gray-50 dark:bg-gray-800"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {editedData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="px-4 py-2 text-sm">
                  {isEditing && editedData.columns[colIndex].editable ? (
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 
                               focus:outline-none focus:border-blue-500 px-1 py-0"
                    />
                  ) : (
                    <span className={!editedData.columns[colIndex].editable ? 'text-gray-500' : ''}>
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}