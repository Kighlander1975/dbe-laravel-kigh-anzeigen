@if (session('success') || session('error') || $errors->any())
    <div class="flash-message-container">
        @if (session('success'))
            <div class="flash-message success">
                {{ session('success') }}
            </div>
        @endif
        @if (session('error'))
            <div class="flash-message error">
                {{ session('error') }}
            </div>
        @endif
        @if ($errors->any())
            <div class="flash-message error">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>
@endif