pragma solidity ^0.4.15;

import "./Contribution.sol";

contract FutureTokenHolder is Ownable {
  using SafeMath for uint256;

  Contribution contribution;
  ERC20 wpr;

  function FutureTokenHolder(address _owner, address _contribution, address _wpr) {
    owner = _owner;
    contribution = Contribution(_contribution);
    wpr = ERC20(_wpr);
  }

  /// @notice The Dev (Owner) will call this method to extract the tokens
  function collectTokens() public onlyOwner {
    uint256 finalizedTime = contribution.finalizedTime();
    require(finalizedTime > 0 && getTime() > finalizedTime.add(1 years));

    uint256 balance = wpr.balanceOf(address(this));
    require(wpr.transfer(owner, balance));
    TokensWithdrawn(owner, balance);
  }

  function getTime() internal returns (uint256) {
    return now;
  }

  //////////
  // Safety Methods
  //////////

  /// @notice This method can be used by the controller to extract mistakenly
  ///  sent tokens to this contract.
  /// @param _token The address of the token contract that you want to recover
  ///  set to 0 in case you want to extract ether.
  function claimTokens(address _token) public onlyOwner {
    require(_token != address(wpr));
    if (_token == 0x0) {
      owner.transfer(this.balance);
      return;
    }

    ERC20 token = ERC20(_token);
    uint256 balance = token.balanceOf(this);
    token.transfer(owner, balance);
    ClaimedTokens(_token, owner, balance);
  }

  event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
  event TokensWithdrawn(address indexed _holder, uint256 _amount);
}
