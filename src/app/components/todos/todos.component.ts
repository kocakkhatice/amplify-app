import { identifierName } from '@angular/compiler';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConsoleLogger } from '@aws-amplify/core';
import { Subscription } from 'rxjs';
import { APIService, DeleteTodoInput, Todo } from '../../API.service';
@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
})
export class TodosComponent implements OnInit, OnDestroy {
  public todos: Array<Todo> = [];
  public leftTodo: number = 0;

  public createForm: FormGroup;
  private subscription: Subscription | null = null;
  private deleteSubscription: Subscription | null = null;
  private updateSubscription: Subscription | null = null;
  private activeTodosList: Array<Todo> = [];
  private completedTodosList: Array<Todo> = [];

  constructor(private apiService: APIService, private fb: FormBuilder) {
    this.createForm = this.fb.group({ name: '', description: '', dueDate: '' });
  }

  ngOnInit(): void {
    this.apiService.ListTodos().then((result) => {
      this.todos = result.items as Todo[];
      // this.listTodos = this.todos;
      this.completedTodosList = this.todos.filter(function (el) {
        return el.done === true;
      });
      this.activeTodosList = this.todos.filter(function (el) {
        return el.done !== true;
      });
      this.leftTodo = this.activeTodosList.length;
    });
    this.subscription = <Subscription>(
      this.apiService.OnCreateTodoListener.subscribe((event: any) => {
        const newTodo = event.value.data.onCreateTodo;
        this.todos = [newTodo, ...this.todos];
        this.completedTodosList = this.todos.filter(function (el) {
          return el.done === true;
        });
        this.activeTodosList = this.todos.filter(function (el) {
          return el.done !== true;
        });
        this.leftTodo = this.activeTodosList.length;
      })
    );
    this.deleteSubscription = <Subscription>(
      this.apiService.OnDeleteTodoListener.subscribe((event: any) => {
        const id = event.value.data.onDeleteTodo.id;
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.completedTodosList = this.todos.filter(function (el) {
          return el.done === true;
        });
        this.activeTodosList = this.todos.filter(function (el) {
          return el.done !== true;
        });
        this.leftTodo = this.activeTodosList.length;
      })
    );
    this.updateSubscription = <Subscription>(
      this.apiService.OnUpdateTodoListener.subscribe((event: any) => {
        const todo = event.value.data.onUpdateTodo;
        const index = this.todos.findIndex((t) => t.id === todo.id);
        this.todos[index] = todo;
        this.completedTodosList = this.todos.filter(function (el) {
          return el.done === true;
        });
        this.activeTodosList = this.todos.filter(function (el) {
          return el.done !== true;
        });
        this.leftTodo = this.activeTodosList.length;
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = null;
    if (this.deleteSubscription) {
      this.deleteSubscription.unsubscribe();
    }
    this.deleteSubscription = null;
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.updateSubscription = null;
  }

  public onToggle(todo: Todo) {
    this.apiService.UpdateTodo({
      id: todo.id,
      name: todo.name,
      description: todo.description,
      dueDate: todo.dueDate,
      done: !todo.done,
    });
  }
  public deleteTodo(todo: any): void {
    const input: DeleteTodoInput = { id: todo.id };
    this.apiService.DeleteTodo(input);
  }

  public onCreate(todo: Todo) {
    todo.done = false;
    this.apiService.CreateTodo(todo);
    this.createForm.reset();
  }
  public allTodos(): void {
    this.todos = [...this.activeTodosList, ...this.completedTodosList];

    this.todos.sort((a: Todo, b: Todo) => {
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
    console.log(this.todos);
  }
  public activeTodos(): void {
    this.todos = this.activeTodosList;
  }
  public completedTodos(): void {
    this.todos = this.completedTodosList;
  }
}
