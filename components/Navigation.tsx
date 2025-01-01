const Navigation = () => {
  return (
    <nav className="bg-white p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">Betty Organic</span>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Products</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
