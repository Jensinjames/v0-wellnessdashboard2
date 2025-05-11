"use client"

import { useState } from "react"
import { useGoalHierarchy } from "@/hooks/use-goal-hierarchy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryForm } from "@/components/goals/category-form"
import { SubcategoryForm } from "@/components/goals/subcategory-form"
import { GoalFormImproved } from "@/components/goals/goal-form-improved"
import { TimeEntryForm } from "@/components/goals/time-entry-form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  FolderPlus,
  FilePlus,
  Plus,
  Trash2,
  PlusCircle,
  Layers,
  Target,
  ClipboardList,
  AlertTriangle,
} from "lucide-react"
import type { GoalCategory, GoalSubcategory, Goal } from "@/types/goals-hierarchy"

export default function GoalsHierarchyPage() {
  const { categories, isLoading, error, deleteCategory, deleteSubcategory, deleteGoal } = useGoalHierarchy()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({})

  // Modals
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<GoalCategory | undefined>(undefined)

  const [subcategoryFormOpen, setSubcategoryFormOpen] = useState(false)
  const [subcategoryToEdit, setSubcategoryToEdit] = useState<GoalSubcategory | undefined>(undefined)
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined)

  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined)
  const [parentSubcategoryId, setParentSubcategoryId] = useState<string | undefined>(undefined)

  const [timeEntryFormOpen, setTimeEntryFormOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined)

  // Toggle expanded states
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId],
    }))
  }

  // Open forms with edit data
  const openCategoryForm = (category?: GoalCategory) => {
    setCategoryToEdit(category)
    setCategoryFormOpen(true)
  }

  const openSubcategoryForm = (subcategory?: GoalSubcategory, categoryId?: string) => {
    setSubcategoryToEdit(subcategory)
    setParentCategoryId(categoryId)
    setSubcategoryFormOpen(true)
  }

  const openGoalForm = (goal?: Goal, subcategoryId?: string) => {
    setGoalToEdit(goal)
    setParentSubcategoryId(subcategoryId)
    setGoalFormOpen(true)
  }

  const openTimeEntryForm = (goalId?: string) => {
    setSelectedGoalId(goalId)
    setTimeEntryFormOpen(true)
  }

  // Close forms
  const closeCategoryForm = () => {
    setCategoryToEdit(undefined)
    setCategoryFormOpen(false)
  }

  const closeSubcategoryForm = () => {
    setSubcategoryToEdit(undefined)
    setParentCategoryId(undefined)
    setSubcategoryFormOpen(false)
  }

  const closeGoalForm = () => {
    setGoalToEdit(undefined)
    setParentSubcategoryId(undefined)
    setGoalFormOpen(false)
  }

  const closeTimeEntryForm = () => {
    setSelectedGoalId(undefined)
    setTimeEntryFormOpen(false)
  }

  // Delete handlers with confirmation
  const handleDeleteCategory = async (category: GoalCategory) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}" and all its contents?`)) {
      await deleteCategory(category.id)
    }
  }

  const handleDeleteSubcategory = async (subcategory: GoalSubcategory) => {
    if (window.confirm(`Are you sure you want to delete the subcategory "${subcategory.name}" and all its goals?`)) {
      await deleteSubcategory(subcategory.id)
    }
  }

  const handleDeleteGoal = async (goal: Goal) => {
    if (window.confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
      await deleteGoal(goal.id)
    }
  }

  // Filter categories by search term
  const filteredCategories = searchTerm
    ? categories.filter((category) => {
        const categoryMatches = category.name.toLowerCase().includes(searchTerm.toLowerCase())
        const subcategoryMatches = (category.subcategories || []).some((subcategory) =>
          subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        const goalMatches = (category.subcategories || []).some((subcategory) =>
          (subcategory.goals || []).some((goal) => goal.name.toLowerCase().includes(searchTerm.toLowerCase())),
        )

        return categoryMatches || subcategoryMatches || goalMatches
      })
    : categories

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container px-4 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goal Hierarchy</h1>
          <p className="text-muted-foreground">
            Create, organize, and track your goals by categories and subcategories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openCategoryForm()}>
            <Plus className="mr-1 h-4 w-4" />
            New Category
          </Button>
          <Button onClick={() => openTimeEntryForm()}>
            <Clock className="mr-1 h-4 w-4" />
            Add Time
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search goals, subcategories, or categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hierarchy">
            <Layers className="mr-1 h-4 w-4" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-1 h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="time">
            <ClipboardList className="mr-1 h-4 w-4" />
            Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 text-muted-foreground">
                  No categories found. Get started by creating your first category.
                </div>
                <Button onClick={() => openCategoryForm()}>
                  <Plus className="mr-1 h-4 w-4" />
                  New Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader
                  className="bg-secondary/50 cursor-pointer flex flex-row items-center justify-between py-4"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center">
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="mr-2 h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="mr-2 h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                        {category.name}
                      </CardTitle>
                      <CardDescription>
                        {category.daily_time_allocation} hours/day •{(category.subcategories || []).length}{" "}
                        subcategories
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openCategoryForm(category)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCategory(category)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {expandedCategories[category.id] && (
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <Button variant="outline" size="sm" onClick={() => openSubcategoryForm(undefined, category.id)}>
                        <FolderPlus className="mr-1 h-4 w-4" />
                        Add Subcategory
                      </Button>

                      {(category.subcategories || []).length === 0 ? (
                        <div className="py-2 text-sm text-muted-foreground">
                          No subcategories yet. Create one to get started.
                        </div>
                      ) : (
                        (category.subcategories || []).map((subcategory) => (
                          <Card key={subcategory.id} className="overflow-hidden">
                            <CardHeader
                              className="py-3 cursor-pointer flex flex-row items-center justify-between"
                              onClick={() => toggleSubcategory(subcategory.id)}
                            >
                              <div className="flex items-center">
                                {expandedSubcategories[subcategory.id] ? (
                                  <ChevronDown className="mr-2 h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                  <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                                  <CardDescription>
                                    {subcategory.daily_time_allocation} hours/day •{(subcategory.goals || []).length}{" "}
                                    goals
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openSubcategoryForm(subcategory)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSubcategory(subcategory)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>

                            {expandedSubcategories[subcategory.id] && (
                              <CardContent className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openGoalForm(undefined, subcategory.id)}
                                  className="mb-3"
                                >
                                  <FilePlus className="mr-1 h-4 w-4" />
                                  Add Goal
                                </Button>

                                {(subcategory.goals || []).length === 0 ? (
                                  <div className="py-2 text-sm text-muted-foreground">
                                    No goals yet. Create one to get started.
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {(subcategory.goals || []).map((goal) => (
                                      <Card key={goal.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                          <div className="flex flex-col md:flex-row justify-between">
                                            <div className="flex-1 md:mr-6">
                                              <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{goal.name}</h4>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openTimeEntryForm(goal.id)}
                                                  >
                                                    <Clock className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openGoalForm(goal)}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDeleteGoal(goal)}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>

                                              {goal.description && (
                                                <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                                              )}

                                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <div>Status: {goal.status}</div>
                                                <div>Priority: {goal.priority}</div>
                                                <div>{goal.daily_time_allocation} hours/day</div>
                                                {goal.due_date && (
                                                  <div>Due: {new Date(goal.due_date).toLocaleDateString()}</div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 md:w-32">
                                              <div className="text-right text-sm mb-1">Progress: {goal.progress}%</div>
                                              <Progress value={goal.progress} className="h-2" />
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>All Goals</CardTitle>
              <CardDescription>View all your goals in a single list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Flatten all goals for a simple list view */}
                {categories.flatMap((category) =>
                  (category.subcategories || []).flatMap((subcategory) =>
                    (subcategory.goals || []).map((goal) => (
                      <Card key={goal.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div className="flex-1 md:mr-6">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{goal.name}</h4>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openTimeEntryForm(goal.id)}
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openGoalForm(goal)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                <span className="text-sm">
                                  {category.name} &gt; {subcategory.name}
                                </span>
                              </div>

                              {goal.description && (
                                <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                              )}

                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                <div>Status: {goal.status}</div>
                                <div>Priority: {goal.priority}</div>
                                <div>{goal.daily_time_allocation} hours/day</div>
                                {goal.due_date && <div>Due: {new Date(goal.due_date).toLocaleDateString()}</div>}
                              </div>
                            </div>

                            <div className="mt-4 md:mt-0 md:w-32">
                              <div className="text-right text-sm mb-1">Progress: {goal.progress}%</div>
                              <Progress value={goal.progress} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )),
                  ),
                )}

                {categories.flatMap((category) =>
                  (category.subcategories || []).flatMap((subcategory) => subcategory.goals || []),
                ).length === 0 && (
                  <div className="py-6 text-center">
                    <div className="mb-4 text-muted-foreground">
                      No goals found. Start by creating a category and subcategory, then add goals.
                    </div>
                    <Button onClick={() => openCategoryForm()}>
                      <Plus className="mr-1 h-4 w-4" />
                      Create First Category
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>View and manage your time allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => openTimeEntryForm()}>
                <PlusCircle className="mr-1 h-4 w-4" />
                Add Time Entry
              </Button>

              {/* Time visualization would go here */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Daily Time Allocations</h3>
                {categories.map((category) => (
                  <div key={category.id} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      <h4 className="font-medium">
                        {category.name}: {category.daily_time_allocation} hours/day
                      </h4>
                    </div>

                    {(category.subcategories || []).map((subcategory) => (
                      <div key={subcategory.id} className="ml-5 mb-4">
                        <h5 className="text-sm font-medium mb-2">
                          {subcategory.name}: {subcategory.daily_time_allocation} hours/day
                        </h5>

                        <div className="space-y-2 ml-5">
                          {(subcategory.goals || []).map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between">
                              <span className="text-sm">{goal.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {goal.daily_time_allocation} hours/day
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {categoryFormOpen && (
        <CategoryForm
          open={categoryFormOpen}
          onClose={closeCategoryForm}
          initialData={categoryToEdit}
          mode={categoryToEdit ? "edit" : "create"}
        />
      )}

      {subcategoryFormOpen && (
        <SubcategoryForm
          open={subcategoryFormOpen}
          onClose={closeSubcategoryForm}
          initialData={subcategoryToEdit}
          parentCategoryId={parentCategoryId}
          mode={subcategoryToEdit ? "edit" : "create"}
        />
      )}

      {goalFormOpen && (
        <GoalFormImproved
          open={goalFormOpen}
          onClose={closeGoalForm}
          initialData={goalToEdit}
          parentSubcategoryId={parentSubcategoryId}
          mode={goalToEdit ? "edit" : "create"}
        />
      )}

      {timeEntryFormOpen && (
        <TimeEntryForm open={timeEntryFormOpen} onClose={closeTimeEntryForm} initialGoalId={selectedGoalId} />
      )}
    </div>
  )
}
