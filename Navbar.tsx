import Link from "next/link";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="font-semibold text-xl text-blue-600">
              Stressedabit
            </Link>
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link href="/#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
                How It Works
              </Link>
              <Link href="/experts" className="text-gray-600 hover:text-blue-600 transition-colors">
                Find Experts
              </Link>
              <Link href="/rewards" className="text-gray-600 hover:text-blue-600 transition-colors">
                Rewards
              </Link>
              <Link href="/premium" className="text-gray-600 hover:text-blue-600 transition-colors">
                Premium
              </Link>
              <Link href="/success-stories" className="text-gray-600 hover:text-blue-600 transition-colors">
                Success Stories
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden md:block">
              Log In
            </Button>
            <Button>Sign Up</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
