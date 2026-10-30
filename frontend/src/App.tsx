import { useState } from 'react';
import './App.css';

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<header>
				Информационные системы. Лабораторная работа 1. Вариант 33312
			</header>
			<button onClick={() => setCount(count + 1)}>Count is {count}</button>
		</>
	);
}

export default App;
