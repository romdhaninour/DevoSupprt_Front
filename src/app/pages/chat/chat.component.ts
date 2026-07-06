import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Chat</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Conversation entre IT et consultant.</p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-sm text-gray-500 dark:text-gray-400">Le module de chat peut être connecté ensuite à un service temps réel.</p>
      </div>
    </div>
  `
})
export class ChatComponent {}
