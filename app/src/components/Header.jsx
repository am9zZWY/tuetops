// Header.jsx
import {Link} from 'react-router-dom';

const Header = () => {
	return (
		<header>
			<h1>Pizza Ordering</h1>
			<nav>
				<ul>
					<li><Link to="/">Home</Link></li>
					<li><Link to="/order-queue">Order Queue</Link></li>
					<li><Link to="/manufactured-orders">Manufactured Orders</Link></li>
				</ul>
			</nav>
		</header>
	);
};

export default Header;
